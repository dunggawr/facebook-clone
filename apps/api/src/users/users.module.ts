import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module.js';
import { UsersController } from './users.controller.js';

@Module({ imports: [FriendsModule], controllers: [UsersController] })
export class UsersModule {}
