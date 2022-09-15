### Operators
```
    eq :'=',
    neq : '<>',
    gt : '>',
    gte : '>=',
    lt : '<',
    lte : '<=',
    ngt :'!>',
    nlt : '!<',
    not : '!',
    in : 'IN',
    btw : 'BETWEEN',
    nbtw : 'NOT BETWEEN',
    nin : 'NOT IN'
```
### Request
```
route?where_name[like]=rakib&filter_age[gte]=20&filter_age[lte]=30&filter_marks[btw]=80:90&filter_position[nbtw]=20:30&filter_class[in]=13&filter_class[in]=14&filter_class[in]=15&sort_by_height=ASC&page=1&per_page=10
```
### Response
```JSON
{
    "data": [
        {
            "id": 4,
            "name": "saa",
            "description": "asdfgh awetaefbgf",
            "url": "https://www.ff.com",
            "status_id": 1000
        }
    ],
    "items_per_page": 1,
    "total_items": 3,
    "current_page": 1,
    "total_pages": 3
}
```
### Parameter Description
* where_ : `where_fieldName[like|eq] = ?`
* filter_ : `filter_fieldName[operator]=?`
    * between: `filter_fieldName[btw]=min:max`
    * not between: `filter_fieldName[btw]=min!max`
    * in : `filter_fieldName[in]=?  filter_fieldName[in]=?` this value willbe array type

### Config 

* sortableColumns: An array of column names (string) of the repository that allow for sort ex. `['id', 'name']`. <b> At least one is required, otherwise error will be thrown.</b>
* searchableColumns: An array of column names (string) of the repository that are allowed for search.Remarks: Search operation only allows 'like' and 'eq' operators. ex. `['name']`,
* defaultSortBy: Array of `['column_name','ASC|DESC']` ex . `[['roll','ASC'],['id':'DESC']]`. If no sortableColumns are selected or no sort params from query params then the data will sort by the default values given in the defaultSortBy.
* filterableColumns: An array of column name(string) of the repository that allow for filter ex. `['id','age']`,
* defaultLimit: Default data LIMIT. The default limit will work if the query params 'take' is undefined. If the take is defined then default value will be the take's value, follow the limit logic.
* maxLimit: Maximum Data Limit.

``` limit= min(take || defaultLimit || 15, maxLimit || 100) ```

* relations: Array of table names that are related to this table. Only left join is allowed here.

### Pagination Pipe

`shared/pipes/paginationPipe.pipe.ts`

It converts the query string to 

### Usage
In `controller.ts`

```typescript
import { PaginationParamsDto } from "../../shared/dtos/pagination-params.dto"
import { PaginationPipe } from "../../shared/pipes/paginationPipe.pipe"

@Get("/")
async index(@Query(new PaginationPipe()) query : PaginationParamsDto){
     return await this.vendorSvc.findAll(query);
}
```

In `service.ts`

```typescript
import { paginate } from "../../shared/paginate"
import { PaginationParamsDto } from "../../shared/dtos/pagination-params.dto"

async findAll(query:PaginationParamsDto):Promise<Paginate<Vendor>>{
	return paginate(query, this.repository, {
		sortableColumns: ['id', 'name'],
		searchableColumns: ['name','description'],
		defaultSortBy: [['id', 'DESC']],
		filterableColumns: ['id'],
		defaultLimit:1,
	})
}
``` 
