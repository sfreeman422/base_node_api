import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SampleModel {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt!: Date;
}
