import { query } from "../db";
import { User } from "../interfaces/User";
import { UserProductFull } from "../interfaces/UserProductFull";

export const create = async (user: User) => {
  const queryText =
    "INSERT INTO users (\
    first_name, \
    last_name, \
    email, \
    password, \
    password_create_date, \
    country, \
    date_of_birth, \
    account_status, \
    account_create_date, \
    email_validation, \
    gender) \
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *";

  const { rows } = await query(queryText, [
    user.firstName,
    user.lastName,
    user.email,
    user.password,
    user.passwordCreateDate,
    user.country,
    user.dateOfBirth,
    user.accountStatus,
    user.accountCreateDate,
    user.emailValidation,
    user.gender,
  ]);

  const res: User = recursiveToCamel(rows[0]);
  return res;
};

export const getById = async (id: number = 0) => {
  const { rows } = await query("SELECT * FROM users WHERE id=$1", [id]);

  if (!rows[0]) {
    return undefined;
  }

  const user: User = recursiveToCamel(rows[0]);
  return user;
};

export const getAll = async () => {
  const { rows } = await query("SELECT * FROM users", []);
  return rows.map((x: User) => {
    // const newX = recursiveToCamel(x);
    return {
      ...x,
      accountCreateDate: new Date(x.accountCreateDate),
      passwordCreateDate: new Date(x.passwordCreateDate),
      dateOfBirth: new Date(x.dateOfBirth),
    } as User;
  });
};

export const getUserProducts = async (
	userId: number,
  page: number = 1,
  orderBy?: string,
  orderDirection?: string,
) => {
  if (page < 1) page = 1;

  const { rows } = await query(
    `SELECT *, product.id as product_id, count(*) OVER() AS count FROM  \
				user_product inner join product on user_product.product_code = product.product_code \
				WHERE user_product.user_id = ($1) ORDER BY id ASC LIMIT 10 OFFSET (($2 - 1) * 10)`,
    [userId, page],
  );

  return [
    rows.map((x) => recursiveToCamel(x) as UserProductFull),
    rows[0] ? rows[0].count : 0,
  ];
};

export const getByEmail = async (email: string) => {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);

  if (!rows[0]) return undefined;

  const user = recursiveToCamel(rows[0]) as User;
  return user;
};

export const deleteById = async (id: number) => {
  await query("DELETE FROM users WHERE id=$1", [id]);
  return;
};

export const updateById = async (id: number = 0, newProps: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 2;
  for (const [key, value] of Object.entries(newProps)) {
    if (!value) continue;
    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `UPDATE users
                       SET ${querys.join(",")}
                       WHERE id = $1 RETURNING *`;

  const { rows } = await query(queryText, [id, ...values]);

  const user: User = recursiveToCamel(rows[0]);
  return user;
};

export const getOne = async (props: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 1;
  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `SELECT *
                       FROM users
                       WHERE ${querys.join(" AND ")}`;

  const { rows } = await query(queryText, [...values]);

  const user: User = recursiveToCamel(rows[0]);
  return user;
};

export const getMany = async (props: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 1;
  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `SELECT *
                       FROM users
                       WHERE ${querys.join(" AND ")}`;

  const { rows } = await query(queryText, [...values]);

  return rows.map((x) => recursiveToCamel(x) as User);
};

// the implementation of the function to filter the users following the general style of the project
export const getTotalActiveUsers = async () => {
  const { rows } = await query(
    `SELECT account_status, COUNT(*) as user_count
                                FROM users
                                GROUP BY account_status`,
    [],
  );

  return rows;
};

export const search = async (
  props: any,
  page: number = 1,
  orderBy?: string,
  orderDirection?: string,
) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 1;
  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    querys.push(camleToSnake(key) + " LIKE " + "$" + i);
    values.push("%" + value + "%");
    i++;
  }

  // added order by to the query
  let queryText = `SELECT users.*, count(user_product.*) as products_count
                     FROM users
										 left join user_product on users.id = user_product.user_id
                     WHERE ${querys.join(" OR ")}
										 GROUP By users.id
                     ORDER BY users.${orderBy ?? "id"} ${orderDirection ?? "asc"}
                     LIMIT 10
                     OFFSET (($${i} - 1) * 10)`;

  if (values.length === 0) {
    queryText = queryText.replace("WHERE", "");
  }

  if (page < 1) page = 1;

  const { rows } = await query(queryText, [...values, page]);

  return [
    rows.map((x) => recursiveToCamel(x) as User),
    rows[0] ? rows[0].count : 0,
  ];
};

const count = async () => {
  const { rows } = await query("SELECT COUNT(*) FROM users", []);

  return rows[0];
};

const UserModel = {
  create,
  getById,
  getAll,
  getOne,
  getMany,
  updateById,
  deleteById,
  getByEmail,
  search,
  getTotalActiveUsers,
  count,
  getUserProducts,
};

export default UserModel;

//////////////////////////////////////////////
const recursiveToCamel = (item: any): any => {
  if (Array.isArray(item)) {
    return item.map((el: unknown) => recursiveToCamel(el));
  } else if (typeof item === "function" || item !== Object(item)) {
    return item;
  } else if (item instanceof Date) {
    return item;
  }
  return Object.fromEntries(
    Object.entries(item as Record<string, unknown>).map(
      ([key, value]: [string, unknown]) => [
        key.replace(/([-_][a-z])/gi, (c) =>
          c.toUpperCase().replace(/[-_]/g, ""),
        ),
        recursiveToCamel(value),
      ],
    ),
  );
};

const camleToSnake = (str: string) =>
  str
    .split(/(?=[A-Z])/)
    .join("_")
    .toLowerCase();
