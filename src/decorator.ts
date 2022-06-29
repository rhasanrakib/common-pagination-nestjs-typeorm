import { PipeTransform, Injectable, ArgumentMetadata, Type } from "@nestjs/common"


@Injectable()
export class Pagination implements PipeTransform<any> {
	async transform(value: any, { metatype }: ArgumentMetadata) {
		
		const queryRegex = /^filter_|^sort_by_|^where_/
		const filterData: { [column: string]: { [column: string]: string } } = {}
		const searchData: { [column: string]: { [column: string]: string } } = {}
		const sortData: [string, string][] = []
		// console.log(metatype.);
		// if (!metatype || !this.toValidate(metatype)) {
		// 	return value
		// }
		for (const i in value) {
			if (queryRegex.test(i)) {
				if (/^filter_/.test(i)) {
					const key = i.replace("filter_", "")
					
					filterData[key] = value[i]
				} else if (/^where_/.test(i)) {
					const key = i.replace("where_", "")
					
					searchData[key] = value[i]
				} else if (/^sort_by_/.test(i)) {
					const key = i.replace("sort_by_", "")
					value[i] = Array.isArray(value[i]) ? value[i] : [value[i]]
                    sortData.push([key, value[i][0]])
				}
				value[i] = undefined
			}
		}
		value.filter   = Object.keys(filterData).length > 0 ? filterData : undefined
		value.searchBy = Object.keys(searchData).length > 0 ? searchData : undefined
		value.sortBy   = Object.keys(sortData).length > 0 ? sortData : undefined

		//const object = plainToClass(metatype, value)
		return value
	}

	private toValidate(metatype: Function): boolean {
		const types: Function[] = [String, Boolean, Number, Array, Object]
		return !types.includes(metatype)
	}
}
function plainToClass(metatype: Type<any>, value: any) {
    throw new Error("Function not implemented.")
}

