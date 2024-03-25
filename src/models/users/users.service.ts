import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Users } from "./entities/users.entities";
import { CreateUserDTO } from "./dto/user.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(Users)
        private readonly userRepository: Repository<Users>,
    ) { }

    async create(userData: CreateUserDTO): Promise<boolean> {
        try {
            const user = this.userRepository.create(userData);
            await this.userRepository.save(user);
            return true;
        } catch (error) {
            return false;
        }
    }

    async updateuserLang(chatData: any): Promise<boolean> {
        const id = chatData.message.chat.id;
        const nativeLang = chatData.data
        try {
            // connection with database and update the user
            this.userRepository.update({ id }, { nativeLang });
            return true
        } catch (error) {
            return false;
        }
    }

    async findUser(id: number): Promise<Users> {
        return await this.userRepository.findOneBy({ id })
    }
}