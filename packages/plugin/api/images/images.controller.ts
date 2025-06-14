import {
    Controller, Get, Post, Put, Delete, RouterSchema,
    Queries, Req, Param, Body, Res,
    CacheControl, ContentType, Raw
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    ImagesService
} from "./images.service";

@Controller("blog/images")
export class ImagesController {
    constructor(private readonly imagesService: ImagesService){}

    /**
     * Processa uma imagem com operações de edição
     * @param body Imagem em base64 e operações a serem realizadas
     * @param res Response
     */
    @Post('process')
    @Auth({ rootOnly: true })
    async processImage(
        @Body() body: {
            imageBase64: string;
            operations: {
                crop?: { left: number; top: number; width: number; height: number; };
                resize?: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; };
                erase?: { left: number; top: number; width: number; height: number; };
            }
        },
        @Res() res: any
    ) {
        try {
            return await this.imagesService.processImageFromBase64(
                body.imageBase64,
                body.operations
            );
        } catch (error: any) {
            console.error('Erro ao processar imagem:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Falha ao processar a imagem'
            });
        }
    }

    /**
     * Endpoint específico para apagar áreas de uma imagem
     * @param body Imagem em base64 e parâmetros da área a ser apagada
     * @param res Response
     */
    @Post('erase')
    @Auth({ rootOnly: true })
    async eraseImageArea(
        @Body() body: {
            imageBase64: string;
            left: number;
            top: number;
            width: number;
            height: number;
        },
        @Res() res: any
    ) {
        try {
            return await this.imagesService.eraseImageAreaFromBase64(
                body.imageBase64,
                body.left,
                body.top,
                body.width,
                body.height
            );
        } catch (error: any) {
            console.error('Erro ao apagar área da imagem:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Falha ao apagar área da imagem'
            });
        }
    }

    /**
     * Endpoint para crop de imagem
     * @param body Imagem em base64 e parâmetros do recorte
     * @param res Response
     */
    @Post('crop')
    @Auth({ rootOnly: true })
    async cropImage(
        @Body() body: {
            imageBase64: string;
            left: number;
            top: number;
            width: number;
            height: number;
        },
        @Res() res: any
    ) {
        try {
            return await this.imagesService.cropImageFromBase64(
                body.imageBase64,
                body.left,
                body.top,
                body.width,
                body.height
            );
        } catch (error: any) {
            console.error('Erro ao cortar imagem:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Falha ao cortar a imagem'
            });
        }
    }

    /**
     * Endpoint para redimensionar imagem
     * @param body Imagem em base64 e parâmetros de redimensionamento
     * @param res Response
     */
    @Post('resize')
    @Auth({ rootOnly: true })
    async resizeImage(
        @Body() body: {
            imageBase64: string;
            width?: number;
            height?: number;
            fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
        },
        @Res() res: any
    ) {
        try {
            return await this.imagesService.resizeImageFromBase64(
                body.imageBase64,
                body.width,
                body.height,
                body.fit
            );
        } catch (error: any) {
            console.error('Erro ao redimensionar imagem:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Falha ao redimensionar a imagem'
            });
        }
    }


}
