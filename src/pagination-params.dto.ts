import { Expose } from "class-transformer"
import { IsOptional } from "class-validator"

export class PaginationParams {
	@Expose()
	@IsOptional()
	readonly page?: number

	@Expose()
	@IsOptional()
	readonly per_page?: number

	@Expose()
	@IsOptional()
	readonly filter?: { [column: string]: { [column: string]: string } }

	@IsOptional()
	@Expose()
	readonly searchBy?: { [column: string]: { [column: string]: string } }

	@Expose()
	@IsOptional()
	readonly sortBy?: [string, string][]
}
