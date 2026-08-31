import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import {
  createNotificationSchema,
  type CreateNotificationDto,
  type NotificationFilterDto,
  type NotificationItemResponseDto,
} from "@aletheia/contracts";
import { JwtAuthGuard, FamilyTenantGuard } from "../../../platform/auth/index.js";
import { ZodValidationPipe } from "../../../platform/validation/index.js";
import { NotificationService } from "../application/notification.service.js";

@Controller({ path: "families/:familyId/notifications", version: "1" })
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async createNotification(
    @Param("familyId") familyId: string,
    @Body(new ZodValidationPipe(createNotificationSchema)) dto: CreateNotificationDto,
  ): Promise<NotificationItemResponseDto> {
    return this.notificationService.createNotification(familyId, dto);
  }

  @Get()
  async listNotifications(
    @Param("familyId") familyId: string,
    @Req() req: { user?: { userId?: string } },
    @Query() filter?: NotificationFilterDto,
  ): Promise<NotificationItemResponseDto[]> {
    const userId = req.user?.userId ?? "";
    return this.notificationService.listNotifications(familyId, userId, filter);
  }

  @Get("unread-count")
  async getUnreadCount(
    @Param("familyId") familyId: string,
    @Req() req: { user?: { userId?: string } },
  ): Promise<{ count: number }> {
    const userId = req.user?.userId ?? "";
    return this.notificationService.getUnreadCount(familyId, userId);
  }

  @Post(":id/read")
  async markAsRead(
    @Param("familyId") familyId: string,
    @Param("id") id: string,
    @Req() req: { user?: { userId?: string } },
  ): Promise<NotificationItemResponseDto> {
    const userId = req.user?.userId ?? "";
    return this.notificationService.markAsRead(familyId, id, userId, true);
  }

  @Post("read-all")
  async markAllAsRead(
    @Param("familyId") familyId: string,
    @Req() req: { user?: { userId?: string } },
  ): Promise<{ count: number }> {
    const userId = req.user?.userId ?? "";
    return this.notificationService.markAllAsRead(familyId, userId);
  }
}
