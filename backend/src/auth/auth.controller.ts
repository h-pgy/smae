import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthRequestLogin } from 'src/auth/models/AuthRequestLogin';
import { EscreverNovaSenhaRequestBody } from 'src/auth/models/EscreverNovaSenhaRequestBody.dto';
import { LoginRequestBody } from 'src/auth/models/LoginRequestBody.dto';
import { PerfilDeAcessoLinhaDto } from 'src/auth/models/PerfilDeAcesso.dto';
import { ReducedAccessToken } from 'src/auth/models/ReducedAccessToken';
import { SolicitarNovaSenhaRequestBody } from 'src/auth/models/SolicitarNovaSenhaRequestBody.dto';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';
import { AuthService } from './auth.service';
import { IsPublic } from './decorators/is-public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AccessToken } from './models/AccessToken';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiTags('Público')
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @UseGuards(LocalAuthGuard)
    @ApiBody({ type: LoginRequestBody })
    @ApiExtraModels(AccessToken, ReducedAccessToken)
    @ApiOkResponse({
        schema: { oneOf: refs(AccessToken, ReducedAccessToken) },
    })
    async login(@Request() req: AuthRequestLogin): Promise<AccessToken | ReducedAccessToken> {
        return this.authService.login(req.user);
    }

    @ApiTags('Minha Conta')
    @Post('sair')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    async logout(@CurrentUser() user: Pessoa) {
        await this.authService.logout(user);
        return ''
    }

    @ApiTags('Público')
    @Post('escrever-nova-senha')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @ApiBody({ type: EscreverNovaSenhaRequestBody })
    async escreverNovaSenha(@Body() body: EscreverNovaSenhaRequestBody) {
        return this.authService.escreverNovaSenha(body);
    }

    @ApiTags('Público')
    @Post('solicitar-nova-senha')
    @HttpCode(HttpStatus.ACCEPTED)
    @IsPublic()
    @ApiBody({ type: SolicitarNovaSenhaRequestBody })
    async solicitaNovaSenha(@Body() body: SolicitarNovaSenhaRequestBody) {
        await this.authService.solicitarNovaSenha(body);
        return '';
    }

    @ApiTags('default')
    @Get('perfil-de-acesso')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ type: PerfilDeAcessoLinhaDto, description: 'Retorna todos os perfis de acesso do sistema' })
    async perfilDeAcesso(): Promise<PerfilDeAcessoLinhaDto> {
        return {
            linhas: await this.authService.listaPerfilAcesso()
        };
    }
}
