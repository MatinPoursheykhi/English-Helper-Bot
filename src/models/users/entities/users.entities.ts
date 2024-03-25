import { Entity, Column, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class Users {

    @PrimaryColumn()
    id: number;

    @Index()
    @Column({ nullable: true })
    username: string;

    @Column({ nullable: true })
    first_name: string;

    @Column()
    type: string;

    @Column({ nullable: true })
    nativeLang: string;
}