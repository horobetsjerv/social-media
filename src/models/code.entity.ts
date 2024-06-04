/* eslint-disable */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  UpdateDateColumn,
  OneToOne,
  JoinColumn, // Добавляем импорт BeforeInsert
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Code {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
