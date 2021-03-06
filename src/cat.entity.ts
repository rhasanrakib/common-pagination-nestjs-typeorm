import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { CatToyEntity } from './cat-toy.entity'


@Entity()
export class CatEntity {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    name: string

    @Column()
    color: string

    @Column({ nullable: true })
    age: number | null

    @OneToMany(() => CatToyEntity, (catToy) => catToy.cat_toy)
    @JoinColumn()
    cat_toy?: CatToyEntity[]

}
