import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateUserDTO {

    @IsNotEmpty()
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsString()
    username?: string;

    @IsString()
    first_name?: string;

    @IsString()
    type: string;

}