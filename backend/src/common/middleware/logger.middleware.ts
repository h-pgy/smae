import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(request: Request, response: Response, next: NextFunction): void {
        const { ip, method, path: url } = request;
        const userAgent = request.get('user-agent') || '';
        const startReqTime = Date.now();
        this.logger.log(
            `${method} ${url} from ${userAgent} ${ip}`
        );

        response.on('close', () => {
            const { statusCode } = response;
            const contentLength = response.get('content-length');
            const took = Date.now() - startReqTime;

            this.logger.log(
                `${method} ${url} ${statusCode} returning ${contentLength} bytes in ${took} ms`
            );
        });

        next();
    }
}
