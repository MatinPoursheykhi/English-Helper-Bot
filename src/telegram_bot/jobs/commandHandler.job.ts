import { commandCodes } from "../constants/bot.constants";

export class CommandHandlerJOB {

    async commandExists(msg: any): Promise<boolean> {
        return commandCodes.includes(msg.text);
    }
}