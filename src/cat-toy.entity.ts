import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CatEntity } from './cat.entity'
import { ToyEntity } from './toy.entity'

@Entity()
export class CatToyEntity {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    cat_id:number

    @Column()
    toy_id:number

    @ManyToOne(() => CatEntity, (cat) => cat.cat_toy)
    @JoinColumn({
        name:"cat_id"
    })
    cat_toy?: CatEntity

    @ManyToOne(() => ToyEntity, (toy) => toy.toy_cat)
    @JoinColumn()
    toy_cat?: ToyEntity

    @CreateDateColumn()
    createdAt: string
}
