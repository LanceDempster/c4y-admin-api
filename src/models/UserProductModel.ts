import { query } from "../db";
import { UserProduct } from "../interfaces/UserProduct";

const create = async (userId: number, productCode: number) => {
  const queryText =
    "INSERT INTO user_product ( \
    user_id, \
    product_code \
    ) VALUES ($1,$2) RETURNING *";

  const { rows } = await query(queryText, [userId, productCode]);

  const res: UserProduct = recursiveToCamel(rows[0]);
  return res;
};

const getById = async (userId: number, productId: number) => {
  const { rows } = await query(
    "SELECT * FROM user_product WHERE user_id=$1 and product_code = $2",
    [userId, productId],
  );

  if (!rows[0]) {
    return undefined;
  }

  const product: UserProduct = recursiveToCamel(rows[0]);
  return product;
};

const getAll = async () => {
  const { rows } = await query("SELECT * FROM products", []);
  return rows.map((x) => recursiveToCamel(x) as UserProduct);
};

const deleteById = async (userId: number, productId: number) => {
  await query(
    "DELETE FROM user_product WHERE user_id=$1 and product_code = $2",
    [userId, productId],
  );
  return;
};

const updateById = async (id: number, newProps: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 2;
  for (const [key, value] of Object.entries(newProps)) {
    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `UPDATE user_product SET ${querys.join(",")} WHERE id = $1 RETURNING *`;

  const { rows } = await query(queryText, [id, ...values]);

  const userProduct: UserProduct = recursiveToCamel(rows[0]);
  return userProduct;
};

const getOne = async (props: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 1;
  for (const [key, value] of Object.entries(props)) {
    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `SELECT * FROM user_product WHERE ${querys.join(" AND ")}`;

  const { rows } = await query(queryText, [...values]);

  const userProduct: UserProduct = recursiveToCamel(rows[0]);
  return userProduct;
};

const getMany = async (props: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 1;
  for (const [key, value] of Object.entries(props)) {
    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
  }

  const queryText = `SELECT * FROM user_product WHERE ${querys.join(" AND ")}`;

  const { rows } = await query(queryText, [...values]);

  return rows.map((x) => recursiveToCamel(x) as UserProduct);
};

export const UserProductModel = {
  create,
  getById,
  getAll,
  getOne,
  getMany,
  updateById,
  deleteById,
};

export default UserProductModel;

//////////////////////////////////////////////
const recursiveToCamel = (item: any): any => {
  if (Array.isArray(item)) {
    return item.map((el) => recursiveToCamel(el));
  } else if (typeof item === "function" || item !== Object(item)) {
    return item;
  }
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, "")),
      recursiveToCamel(value),
    ]),
  );
};

const camleToSnake = (str: string) =>
  str
    .split(/(?=[A-Z])/)
    .join("_")
    .toLowerCase();
