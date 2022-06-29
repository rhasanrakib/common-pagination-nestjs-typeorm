import {
    Repository,
    SelectQueryBuilder,
    FindOperator,
    Equal,
    MoreThan,
    MoreThanOrEqual,
    In,
    IsNull,
    LessThan,
    LessThanOrEqual,
    Not,
    ILike,
    Brackets,
    Between,
    FindOptionsWhere,
} from 'typeorm'
import { PaginationParams } from './pagination-params.dto'
import { ServiceUnavailableException } from '@nestjs/common'
import { values, mapKeys } from 'lodash'
import { stringify } from 'querystring'
import { WherePredicateOperator } from 'typeorm/query-builder/WhereClause'
import { Column, Order, RelationColumn, SortBy } from './helper'

export class Paginated<T> {
	data: T[]
	items_per_page: number
	total_items: number
	current_page: number
	total_pages: number
}

export interface PaginateConfig<T> {
    relations?: RelationColumn<T>[]
    sortableColumns: Column<T>[]
    searchableColumns?: Column<T>[]
    maxLimit?: number
    defaultSortBy?: SortBy<T>
    defaultLimit?: number
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]
    filterableColumns?: { [key in Column<T>]?: FilterOperator[] }
    withDeleted?: boolean
}

export enum FilterOperator {
    EQ = '$eq',
    GT = '$gt',
    GTE = '$gte',
    IN = '$in',
    NULL = '$null',
    LT = '$lt',
    LTE = '$lte',
    BTW = '$btw',
    NOT = '$not',
    LIKE = '$like'
}

export function isOperator(value: unknown): value is FilterOperator {
    return values(FilterOperator).includes(value as any)
}

export const OperatorSymbolToFunction = new Map<FilterOperator, (...args: any[]) => FindOperator<string>>([
    [FilterOperator.EQ, Equal],
    [FilterOperator.GT, MoreThan],
    [FilterOperator.GTE, MoreThanOrEqual],
    [FilterOperator.IN, In],
    [FilterOperator.NULL, IsNull],
    [FilterOperator.LT, LessThan],
    [FilterOperator.LTE, LessThanOrEqual],
    [FilterOperator.BTW, Between],
    [FilterOperator.NOT, Not],
    [FilterOperator.LIKE,ILike]
])

export function getFilterTokens(raw: string): string[] {
    const tokens = []
    const matches = raw.match(/(\$\w+):/g)

    if (matches) {
        const value = raw.replace(matches.join(''), '')
        tokens.push(...matches.map((token) => token.substring(0, token.length - 1)), value)
    } else {
        tokens.push(raw)
    }

    if (tokens.length === 0 || tokens.length > 3) {
        return []
    } else if (tokens.length === 2) {
        if (tokens[1] !== FilterOperator.NULL) {
            tokens.unshift(null)
        }
    } else if (tokens.length === 1) {
        if (tokens[0] === FilterOperator.NULL) {
            tokens.unshift(null)
            
        } else if(tokens[0] === FilterOperator.EQ) {
            tokens.unshift(null, FilterOperator.EQ)
        }else{
            tokens.unshift(null, FilterOperator.LIKE)
        }
    }

    return tokens
}

function parseFilter<T>(query: PaginationParams, config: PaginateConfig<T>) {

    const filter: { [columnName: string]: FindOperator<string> } = {}
    for (const column of Object.keys(query.filter)) {

        if (!(column in config.filterableColumns)) {
           
            continue
        }
        
        const allowedOperators = config.filterableColumns[column]

        const input = query.filter[column]

        for (const raw in input) {
            
           
            for(const op in input){
                let statements="";
                statements+="$"+op+":";
                statements+=input[op]
            
                const tokens = getFilterTokens(statements)
                if (tokens.length === 0) {
                    continue
                }
                const [op2, op1, value] = tokens

                if (!isOperator(op1) || !allowedOperators.includes(op1)) {
                    continue
                }
                if (isOperator(op2) && !allowedOperators.includes(op2)) {
                    continue
                }
                if (isOperator(op1)) {
                    switch (op1) {
                        case FilterOperator.BTW:
                            filter[column] = OperatorSymbolToFunction.get(op1)(...value.split(','))
                            break
                        case FilterOperator.IN:
                            filter[column] = OperatorSymbolToFunction.get(op1)(value.split(','))
                            break
                        case FilterOperator.LIKE:
                            filter[column] = OperatorSymbolToFunction.get(op1)(`%${value}%`)
                            break
                        default:
                            filter[column] = OperatorSymbolToFunction.get(op1)(value)
                            break
                    }
                }
                if (isOperator(op2)) {
                    filter[column] = OperatorSymbolToFunction.get(op2)(filter[column])
                }
            }
        }
    }
    return filter
}

export async function paginate<T>(
    query: PaginationParams,
    repo: Repository<T> | SelectQueryBuilder<T>,
    config: PaginateConfig<T>
): Promise<Paginated<T>> {
    let page = query.page || 1
	config.maxLimit = config.maxLimit
		? config.maxLimit < 1
			? undefined
			: config.maxLimit
		: undefined
	config.defaultLimit = config.defaultLimit
		? config.defaultLimit < 1
			? undefined
			: config.defaultLimit
		: undefined
	const limit = Math.min(
		(query.per_page ? (query.per_page < 1 ? undefined : query.per_page) : undefined) ||
			config.defaultLimit ||
			15,
		config.maxLimit || 100
	)
    const sortBy = [] as SortBy<T>
    const searchBy: Column<T>[] = []

    function isEntityKey(entityColumns: Column<T>[], column: string): column is Column<T> {
        return !!entityColumns.find((c) => c === column)
    }

    if (config.sortableColumns.length < 1) throw new ServiceUnavailableException()

    if (query.sortBy) {
        for (const order of query.sortBy) {
            if (isEntityKey(config.sortableColumns, order[0]) && ['ASC', 'DESC'].includes(order[1])) {
                sortBy.push(order as Order<T>)
            }
        }
    }

    if (!sortBy.length) {
        sortBy.push(...(config.defaultSortBy || [[config.sortableColumns[0], 'ASC']]))
    }

    if (page < 1) page = 1

    let [items, totalItems]: [T[], number] = [[], 0]

    let queryBuilder: SelectQueryBuilder<T>

    if (repo instanceof Repository) {
        queryBuilder = repo
            .createQueryBuilder('e')
            .take(limit)
            .skip((page - 1) * limit)
    } else {
        queryBuilder = repo.take(limit).skip((page - 1) * limit)
    }
    if (config.relations?.length) {
        config.relations.forEach((relation) => {
            queryBuilder.leftJoinAndSelect(`${queryBuilder.alias}.${relation}`, `${queryBuilder.alias}_${relation}`)
        })
    }

    for (const order of sortBy) {
        if (order[0].split('.').length > 1) {
            queryBuilder.addOrderBy(`${queryBuilder.alias}_${order[0]}`, order[1])
        } else {
            queryBuilder.addOrderBy(`${queryBuilder.alias}.${order[0]}`, order[1])
        }
    }

    if (config.where) {
        queryBuilder.andWhere(new Brackets((qb) => qb.andWhere(config.where)))
    }
    if (config.withDeleted) {
        queryBuilder.withDeleted()
    }
    if (query.searchBy && searchBy.length) {
        queryBuilder.andWhere(
            new Brackets((qb: SelectQueryBuilder<T>) => {
                for (const column of searchBy) {
                    const propertyPath = (column as string).split('.')
                    if (propertyPath.length > 1) {
                        const condition: WherePredicateOperator = {
                            operator: 'ilike',
                            parameters: [`${qb.alias}_${column}`, `:${column}`],
                        }
                        qb.orWhere(qb['createWhereConditionExpression'](condition), {
                            [column]: `%${query.searchBy}%`,
                        })
                    } else {
                        qb.orWhere({
                            [column]: ILike(`%${query.searchBy}%`),
                        })
                    }
                }
            })
        )
    }

    if (query.filter) {
        const filter = parseFilter(query, config)
        queryBuilder.andWhere(
            new Brackets((qb: SelectQueryBuilder<T>) => {
                for (const column in filter) {
                    const propertyPath = (column as string).split('.')
                    if (propertyPath.length > 1) {
                        const condition = qb['getWherePredicateCondition'](
                            column,
                            filter[column]
                        ) as WherePredicateOperator
                        let parameters = { [column]: filter[column].value }
                        // TODO: refactor below
                        switch (condition.operator) {
                            case 'between':
                                condition.parameters = [`${qb.alias}_${column}`, `:${column}_from`, `:${column}_to`]
                                parameters = {
                                    [column + '_from']: filter[column].value[0],
                                    [column + '_to']: filter[column].value[1],
                                }
                                break
                            case 'in':
                                condition.parameters = [`${qb.alias}_${column}`, `:...${column}`]
                                break
                            default:
                                condition.parameters = [`${qb.alias}_${column}`, `:${column}`]
                                break
                        }
                        qb.andWhere(qb['createWhereConditionExpression'](condition), parameters)
                    } else {
                        qb.andWhere({
                            [column]: filter[column],
                        })
                    }
                }
            })
        )
    }

    ;[items, totalItems] = await queryBuilder.getManyAndCount()

    let totalPages = totalItems / limit
    if (totalItems % limit) totalPages = Math.ceil(totalPages)

    const results: Paginated<T> = {
		data: items,
		items_per_page: limit,
		total_items: totalItems,
		current_page: page,
		total_pages: totalPages,
	}

    return Object.assign(new Paginated<T>(), results)
}
