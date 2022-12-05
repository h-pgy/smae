import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MinhaContaController } from './minha-conta/minha-conta.controller';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { OrgaoModule } from './orgao/orgao.module';
import { TipoOrgaoModule } from './tipo-orgao/tipo-orgao.module';
import { OdsModule } from './ods/ods.module';
import { EixoModule } from './eixo/eixo.module';
import { PdmModule } from './pdm/pdm.module';
import { FonteRecursoModule } from './fonte-recurso/fonte-recurso.module';
import { TipoDocumentoModule } from './tipo-documento/tipo-documento.module';
import { TagModule } from './tag/tag.module';
import { ObjetivoEstrategicoModule } from './objetivo-estrategico/objetivo-estrategico.module';
import { RegiaoModule } from './regiao/regiao.module';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { SubTemaModule } from './subtema/subtema.module';
import { MetaModule } from './meta/meta.module';
import { IndicadorModule } from './indicador/indicador.module';
import { UnidadeMedidaModule } from './unidade-medida/unidade-medida.module';
import { VariavelModule } from './variavel/variavel.module';
import { IniciativaModule } from './iniciativa/iniciativa.module';
import { AtividadeModule } from './atividade/atividade.module';
import { CronogramaModule } from './cronograma/cronograma.module';
import { EtapaModule } from './etapa/etapa.module';
import { CronogramaEtapaModule } from './cronograma-etapas/cronograma-etapas.module';
import { ScheduleModule } from '@nestjs/schedule';

import { PainelModule } from './painel/painel.module';
import { MfModule } from './mf/mf.module';
import { MetasModule as MfMetasModule } from './mf/metas/metas.module';
import { GrupoPaineisModule } from './grupo-paineis/grupo-paineis.module';
import { PdmCicloModule } from './pdm-ciclo/pdm-ciclo.module';
import { MetaOrcamentoModule } from './meta-orcamento/meta-orcamento.module';
import { OrcamentoPlanejadoModule } from './orcamento-planejado/orcamento-planejado.module';
import { DotacaoModule } from './dotacao/dotacao.module';
import { SofApiModule } from './sof-api/sof-api.module';
import { OrcamentoRealizadoModule } from './orcamento-realizado/orcamento-realizado.module';


@Module({
    imports: [
        ConfigModule.forRoot(),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/public',
        }),
        SofApiModule,
        MetaOrcamentoModule,
        PrismaModule, PessoaModule, AuthModule, MinhaContaModule, OrgaoModule, TipoOrgaoModule, OdsModule, EixoModule, PdmModule, FonteRecursoModule, TipoDocumentoModule, TagModule, ObjetivoEstrategicoModule, RegiaoModule, UploadModule,
        SubTemaModule,
        MetaModule,
        IndicadorModule,
        UnidadeMedidaModule,
        IniciativaModule,
        AtividadeModule,
        VariavelModule,
        CronogramaModule,
        EtapaModule,
        CronogramaEtapaModule,
        PainelModule,
        ScheduleModule.forRoot(),
        MfMetasModule,
        GrupoPaineisModule,
        RouterModule.register([
            {
                path: 'mf',
                module: MfModule,
                children: [
                    MfMetasModule
                ]
            },
        ]),
        PdmCicloModule,
        OrcamentoPlanejadoModule,
        DotacaoModule,
        OrcamentoRealizadoModule,
    ],
    controllers: [AppController, MinhaContaController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes({
                path: '*',
                method: RequestMethod.ALL
            });
    }

}
