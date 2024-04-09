import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkflowfluxoFaseService } from './workflow-fluxo-fase.service';
import { CreateWorkflowfluxoFaseDto, UpsertWorkflowFluxoFaseSituacaoDto } from './dto/create-workflow-fluxo-fase.dto';
import { FilterWorkflowfluxoFaseDto } from './dto/filter-workflow-fluxo-fase.dto';
import { UpdateWorkflowfluxoFaseDto } from './dto/update-workflow-fluxo-fase.dto';
import { ListWorkflowfluxoFaseDto } from './entities/workflow-fluxo-fase.entity';

@ApiTags('Workflow - Configuração')
@Controller('workflow-fluxo-fase')
export class WorkflowfluxoFaseController {
    constructor(private readonly workflowfluxoFaseService: WorkflowfluxoFaseService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.inserir')
    @ApiUnauthorizedResponse()
    async create(@Body() dto: CreateWorkflowfluxoFaseDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.workflowfluxoFaseService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.listar')
    @Get()
    async findAll(
        @Query() filters: FilterWorkflowfluxoFaseDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListWorkflowfluxoFaseDto> {
        return { linhas: await this.workflowfluxoFaseService.findAll(filters, user) };
    }

    // @Get(':id')
    // @ApiBearerAuth('access-token')
    // @Roles('CadastroWorkflows.listar')
    // @ApiUnauthorizedResponse()
    // async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
    //     return await this.workflowfluxoFaseService.f(params.id, user);
    // }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.editar')
    @ApiUnauthorizedResponse()
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWorkflowfluxoFaseDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowfluxoFaseService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroWorkflows.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.workflowfluxoFaseService.remove(+params.id, user);
        return '';
    }

    @Post(':id/situacao')
    @ApiBearerAuth('access-token')
    @Roles('CadastroWorkflows.editar')
    @ApiUnauthorizedResponse()
    async upsertSituacao(
        @Param() params: FindOneParams,
        @Body() dto: UpsertWorkflowFluxoFaseSituacaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.workflowfluxoFaseService.upsertSituacao(+params.id, dto, user);
    }
}