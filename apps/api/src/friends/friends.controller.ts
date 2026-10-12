import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthedRequest } from '../auth/auth.guard.js';
import { FriendsService } from './friends.service.js';

@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get() list(@Req() req: AuthedRequest) { return this.friends.list(req.user.id); }

  @Get('requests') incoming(@Req() req: AuthedRequest) { return this.friends.incoming(req.user.id); }

  @Post('requests/:userId')
  send(@Req() req: AuthedRequest, @Param('userId', ParseUUIDPipe) id: string) {
    return this.friends.sendRequest(req.user.id, id);
  }

  @Post('requests/:userId/accept')
  accept(@Req() req: AuthedRequest, @Param('userId', ParseUUIDPipe) id: string) {
    return this.friends.accept(req.user.id, id);
  }

  @Delete(':userId')
  remove(@Req() req: AuthedRequest, @Param('userId', ParseUUIDPipe) id: string) {
    return this.friends.remove(req.user.id, id);
  }
}
