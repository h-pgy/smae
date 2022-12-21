import { Injectable, Logger } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileOutput, ReportableService } from '../utils/utils.service';
import { CreateIndicadorDto } from './dto/create-indicadore.dto';
import { ListIndicadoresDto } from './entities/indicadores.entity';

@Injectable()
export class IndicadoresService implements ReportableService {
    private readonly logger = new Logger(IndicadoresService.name);
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(dto: CreateIndicadorDto): Promise<ListIndicadoresDto> {
        throw 'not implemented';
    }


    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as ListIndicadoresDto;

        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });

        const out: FileOutput[] = [];


        return [
            {
                name: 'info.json',
                buffer: Buffer.from(JSON.stringify({
                    params: params,
                    "horario": Date2YMD.tzSp2UTC(new Date())
                }), "utf8")
            },

        ]
    }
}
