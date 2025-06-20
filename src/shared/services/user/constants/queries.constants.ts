export const SelectUserByEmailQuerySQL = `
  SELECT id, email, first_name, last_name, dob, created_at FROM "user"
  WHERE email = $1;
`;

export const SelectUserByIdQuerySQL = `
  SELECT id, email, first_name, last_name, dob, created_at FROM "user"
  WHERE id = $1;
`;

export const SelectUserByIdWithPasswordQuerySQL = `
  SELECT id, email, password, first_name, last_name, dob, created_at FROM "user"
  WHERE id = $1;
`;

export const InsertUserQuerySQL = `
  INSERT INTO "user" (id, email, password, first_name, last_name, dob)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING id, email, first_name, last_name, dob, created_at;
`;

export const RemoveUserQuerySQL = `DELETE FROM "user" WHERE id=$1;`;

export const UpdateUserPasswordSql = `UPDATE "user" SET password = $1 WHERE id = $2 RETURNING id;`;
