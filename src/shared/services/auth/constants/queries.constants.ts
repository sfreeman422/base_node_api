export const GetUserByEmailQuerySQL = `SELECT * from "user" WHERE email = $1;`;
export const GetUserByIdQuerySQL = `SELECT * from "user" WHERE id = $1;`;
