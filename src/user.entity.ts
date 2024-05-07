/* eslint-disable */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  UpdateDateColumn, // Добавляем импорт BeforeInsert
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Code } from './code.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @OneToOne(() => Code, (code) => code.user)
  @JoinColumn({ name: 'userId' }) // Указываем имя столбца, на который ссылается внешний ключ
  code: Code;
}
