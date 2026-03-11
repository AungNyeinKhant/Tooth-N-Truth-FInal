import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards';
import { CurrentUser } from '../../core/decorators';
import { UploadService } from './upload.service';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile image with automatic role-based folder' })
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Get role from JWT token
    const userRole = role || 'PATIENT';

    // Get existing profile image for potential deletion
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    let uploadedUrl = null;
    let uploadedPublicId = null;

    try {
      // Upload to Cloudinary with role-based folder
      const result = await this.uploadService.uploadProfileImage(file, userId, userRole);
      uploadedUrl = result.url;
      uploadedPublicId = result.publicId;

      // Delete old image if exists
      if (existingUser?.profileImage) {
        await this.uploadService.deleteByUrl(existingUser.profileImage);
      }

      // Update user profile with new image URL
      await this.prisma.user.update({
        where: { id: userId },
        data: { profileImage: result.url },
      });

      return {
        url: result.url,
        message: 'Profile image uploaded successfully',
      };
    } catch (error) {
      // ROLLBACK: Delete the newly uploaded image if it was uploaded
      if (uploadedUrl) {
        console.error('Upload succeeded but subsequent step failed. Rolling back...');
        try {
          await this.uploadService.deleteByUrl(uploadedUrl);
          console.log('Rollback successful: deleted uploaded image');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      throw error;
    }
  }

  @Delete('profile-image')
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiResponse({ status: 200, description: 'Profile image deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteProfileImage(@CurrentUser('sub') userId: string) {
    // Get current profile image
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    if (user?.profileImage) {
      // Use the service method to delete
      await this.uploadService.deleteByUrl(user.profileImage);
    }

    // Clear profile image in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
    });

    return { message: 'Profile image deleted successfully' };
  }

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload single image (reusable)' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    const result = await this.uploadService.uploadSingle(file, folder);

    return {
      url: result.url,
      publicId: result.publicId,
      message: 'Image uploaded successfully',
    };
  }
}
