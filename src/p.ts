const OperatorObject = {
	eq: "=",
	neq: "<>",
	gt: ">",
	gte: ">=",
	lt: "<",
	lte: "<=",
	ngt: "!>",
	nlt: "!<",
	not: "!",
	in: "IN",
	btw: "BETWEEN",
	nbtw: "NOT BETWEEN",
	nin: "NOT IN",
}
const filterQueryBuilder = (filterData: {
	[column: string]: { [operator: string]: string }
}): string[] => {
	const queryString: string[] = []
	for (const column in filterData) {
		let queryStr = ""

		for (const operator in filterData[column]) {
			queryStr += `e.${column}`
			if (Object.keys(OperatorObject).includes(operator)) {
				switch (operator) {
					case "btw":
						let [min, max] = filterData[column][operator].split(":", 2)
						;[min, max] = parseInt(min) > parseInt(max) ? [max, min] : [min, max]
						queryStr += ` ${OperatorObject[operator]} ${min} AND ${max}`
						break
					case "nbtw":
						let [_min, _max] = filterData[column][operator].split("!", 2)
						;[_min, _max] =
							parseInt(_min) > parseInt(_max) ? [_max, _min] : [_min, _max]
						queryStr += ` ${OperatorObject[operator]} ${_min} AND ${_max}`
						break
					case "in":
						const inValue = Array.isArray(filterData[column][operator])
							? filterData[column][operator]
							: [filterData[column][operator]]
						queryStr += ` ${OperatorObject[operator]} (${inValue.toString()})`
						break
					case "nin":
						const ninValue = Array.isArray(filterData[column][operator])
							? filterData[column][operator]
							: [filterData[column][operator]]
						queryStr += ` ${OperatorObject[operator]} (${ninValue.toString()})`
						break
					default:
						if (
							Object.keys(filterData[column])[
								Object.keys(filterData[column]).length - 1
							] != operator
						) {
							queryStr += ` ${OperatorObject[operator]} ${filterData[column][operator]} AND `
						} else {
							queryStr += ` ${OperatorObject[operator]} ${filterData[column][operator]} `
						}
						break
				}
			}
		}

		if (queryStr.length > 0) {
			queryString.push(queryStr)
		}
	}

	return queryString
}
export interface PaginateConfiguration {
	relations?: any
	sortableColumns: []
	//searchableColumns?: Column<T>[]
	maxLimit?: number
	//defaultSortBy?: SortBy<T>
	defaultLimit?: number
	//where?: FindConditions<T> | FindConditions<T>[]
	filterableColumns?: []
}
export async function paginate(){

}