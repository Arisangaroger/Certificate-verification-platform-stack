import { Controller, Post, Body } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  AdminLoginResponseDto,
  MessageResponseDto,
  StudentLoginResponseDto,
} from '../../common/swagger/response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('admin/login')
  @ApiOperation({ summary: 'Admin login', description: 'Authenticate an institution admin or super admin and receive a JWT.' })
  @ApiOkResponse({ type: AdminLoginResponseDto, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async adminLogin(@Body() body: LoginAdminDto) {
    return this.authService.loginAdmin(body.email, body.password);
  }

  @Public()
  @Post('student/request-otp')
  @ApiOperation({ summary: 'Request student OTP', description: 'Send a one-time password to the student after validating registration number and national ID.' })
  @ApiOkResponse({ type: MessageResponseDto, description: 'OTP sent to student email' })
  @ApiResponse({ status: 401, description: 'Invalid student credentials' })
  async requestStudentOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestStudentOtp(body.student_id_number, body.national_id);
  }

  @Public()
  @Post('student/verify-otp')
  @ApiOperation({ summary: 'Verify student OTP', description: 'Validate the OTP and receive a student JWT.' })
  @ApiOkResponse({ type: StudentLoginResponseDto, description: 'OTP verified' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyStudentOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyStudentOtp(body.student_id_number, body.national_id, body.otp);
  }
}
