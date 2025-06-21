import {
    Controller, Get, Post,
    Delete, Res, Query, Body
} from "@cmmv/http";

import {
    Auth
} from "@cmmv/auth";

import {
    BackupService
} from "./backup.service";

@Controller("blog")
export class BackupController {
    constructor(private readonly backupService: BackupService){}

    @Get("backup")
    @Auth({ rootOnly: true })
    async getBackups() {
        return this.backupService.getBackups();
    }

    @Post("backup/create")
    @Auth({ rootOnly: true })
    async createBackup() {
        return this.backupService.backupDatabase();
    }

    @Delete("backup/delete")
    @Auth({ rootOnly: true })
    async deleteBackup(@Query("filename") filename: string) {
        return this.backupService.deleteBackup(filename);
    }

    @Get("backup/download")
    async downloadBackup(@Query("filename") filename: string, @Res() response) {
        response.res.writeHead(200, {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });

        const stream: any = await this.backupService.downloadBackup(filename);

        if(stream)
            stream.pipe(response.res);
        else
            response.res.end();
    }

    @Get("backup/medias")
    @Auth({ rootOnly: true })
    async getMediaBackups() {
        return this.backupService.getMediaBackups();
    }

    @Post("backup/medias/create")
    @Auth({ rootOnly: true })
    async createMediaBackup(@Body() body: {mediaIds: string[]}) {
        return this.backupService.backupMediasBeforeDeletion(body.mediaIds);
    }

    @Post("backup/medias/rollback")
    @Auth({ rootOnly: true })
    async rollbackMediaBackup(@Body() body: {filename: string}) {
        return this.backupService.rollbackMediasBackup(body.filename);
    }

    @Get("backup/sqlite")
    @Auth({ rootOnly: true })
    async getSQLiteBackups() {
        return this.backupService.getSQLiteBackups();
    }

    @Post("backup/sqlite/create")
    @Auth({ rootOnly: true })
    async createSQLiteBackup() {
        return this.backupService.backupSQLiteDatabase();
    }
}
