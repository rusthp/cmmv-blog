import { Controller } from "@cmmv/http";
import { OddsSettingsService } from "./settings.service";

@Controller("odds/settings")
export class OddsSettingsController {
    constructor(private readonly oddsSettingsService: OddsSettingsService) {}
} 