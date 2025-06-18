import { Module } from '@cmmv/core';

import { ImagesController } from './images.controller';
import { ImagesService } from "./images.service";

export const ImagesModule = new Module('blog_images', {
    controllers: [ImagesController],
    providers: [ImagesService]
});
