import { query } from "../db";
import { DeviceType } from "../interfaces/DeviceType";

export const create = async (deviceType: DeviceType) => {
  const queryText =
    "INSERT INTO device_type (\
    name, \
    description) \
    VALUES ($1, $2) RETURNING *";

  const { rows } = await query(queryText, [
    deviceType.name,
    deviceType.description,
  ]);

  const res: DeviceType = recursiveToCamel(rows[0]);
  return res;
};

export const getById = async (id: number) => {
  const { rows } = await query("SELECT * FROM device_type WHERE id=$1", [id]);

  if (!rows[0]) {
    return undefined;
  }

  const device_type: DeviceType = recursiveToCamel(rows[0]);
  return device_type;
};

// export const getAll = async () => {
//     const { rows } = await query('SELECT * FROM products', []);
//     return rows.map(x => recursiveToCamel(x) as Product);
// }
//
// export const getByEmail = async (email: string) => {
//     const { rows } = await query('SELECT * FROM products WHERE email = $1', [email]);
//
//     if (!rows[0]) return undefined;
//
//     const user = recursiveToCamel(rows[0]) as Product;
//     return user;
// }
//
export const deleteById = async (id: number) => {
  await query("DELETE FROM device_type WHERE id=$1", [id]);
  return;
};
//
//
export const updateById = async (id: number, newProps: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 2;
  for (const [key, value] of Object.entries(newProps)) {
    if (value === "") {
    } else if (!value) continue;
    if (key === "user" || key === "token") continue;

    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `UPDATE device_type
                       SET ${querys.join(",")}
                       WHERE id = $1 RETURNING *`;

  const { rows } = await query(queryText, [id, ...values]);

  const device_type: DeviceType = recursiveToCamel(rows[0]);
  return device_type;
};
//
// export const getOne = async (props: any) => {
//     const querys: string[] = [];
//     const values: any[] = [];
//
//     let i = 1;
//     for (const [key, value] of Object.entries(props)) {
//         if (!value) continue;
//         querys.push(camleToSnake(key) + '=' + '$' + i);
//         values.push(value);
//         i++;
//     }
//
//     const queryText = `SELECT * FROM products WHERE ${querys.join(' AND ')}`;
//
//     const { rows } = await query(queryText, [...values]);
//
//     const admin: Product = recursiveToCamel(rows[0])
//     return admin;
// }
//
// export const getMany = async (props: any, page: number) => {
//     const querys: string[] = [];
//     const values: any[] = [];
//
//     let i = 1;
//     for (const [key, value] of Object.entries(props)) {
//         if (!value) continue;
//         querys.push(camleToSnake(key) + '=' + '$' + i);
//         values.push(value);
//         i++;
//     }
//
//     const queryText = `SELECT * FROM products WHERE ${querys.join(' AND ')} \
//     LIMIT 10 OFFSET {($${i} - 1) * 10}`;
//
//     const { rows } = await query(queryText, [...values, page]);
//
//     return rows.map(x => recursiveToCamel(x) as Product);
// }

export const search = async (props: any, page: number = 1) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 1;
  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    querys.push(camleToSnake(key) + " ILIKE " + "$" + i);
    values.push("%" + value + "%");
    i++;
  }

  let queryText = `SELECT *, count(*) OVER () AS count
                     FROM device_type
                     WHERE ${querys.join(" OR ")}
                     ORDER BY id ASC
                     LIMIT 10
                     OFFSET
        (($${i} - 1) * 10)`;

  if (values.length === 0) {
    queryText = queryText.replace("WHERE", "");
  }

  if (page < 1) page = 1;

  const { rows } = await query(queryText, [...values, page]);

  return [
    rows.map((x) => recursiveToCamel(x) as DeviceType),
    rows[0] ? rows[0].count : 0,
  ];
};

const count = async () => {
  const { rows } = await query("SELECT COUNT(*) FROM device_type", []);

  return rows[0];
};

const DeviceTypeModal = {
  create,
  getById,
  // getAll,
  // getOne,
  // getMany,
  updateById,
  deleteById,
  // getByEmail,
  search,
  count,
};

export default DeviceTypeModal;

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
