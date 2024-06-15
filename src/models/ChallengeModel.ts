import { query } from "../db";
import { Challenge } from "../interfaces/Challenge";
import { Ticket } from "../interfaces/Ticket";
import TicketStatusModel from "../models/TicketStatusModel";

export const create = async (challenge: Challenge) => {
  const queryText =
    "INSERT INTO challenges(\
    Name, \
    description, \
    challenge_image, \
    challenge_url \
    ) \
    VALUES ($1, $2, $3, $4) RETURNING *";

  const { rows } = await query(queryText, [
    challenge.name,
    challenge.description,
    challenge.challengeImage,
    challenge.challengeUrl,
  ]);

  const res: Challenge = recursiveToCamel(rows[0]);

  return res;
};

export const getById = async (id: number) => {
  const { rows } = await query("SELECT * FROM challenges WHERE id=$1", [id]);

  if (!rows[0]) {
    return undefined;
  }

  const challange: Challenge = recursiveToCamel(rows[0]);
  return challange;
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

export const deleteById = async (id: number) => {
  await query("DELETE FROM challenges WHERE id=$1", [id]);
  return;
};

export const updateById = async (id: number, newProps: any) => {
  const querys: string[] = [];
  const values: any[] = [];

  let i = 2;
  for (const [key, value] of Object.entries(newProps)) {
    if (!value) continue;

    if (key === "user" || key === "token") continue;

    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `UPDATE challenges
                       SET ${querys.join(",")}
                       WHERE id = $1 RETURNING *`;

  const { rows } = await query(queryText, [id, ...values]);

  const challenge: Challenge = recursiveToCamel(rows[0]);
  return challenge;
};

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
    querys.push(camleToSnake(key) + " LIKE " + "$" + i);
    values.push("%" + value);
    i++;
  }

  let queryText = `
    SELECT challenges.*, 
           count(*) OVER () AS count
    FROM challenges
    ${querys.length ? "WHERE " + querys.join(" AND ") : ""}
    ORDER BY challenges.id ASC
    LIMIT 10
    OFFSET (($${i} - 1) * 10)
  `;

  if (page < 1) page = 1;
  const { rows } = await query(queryText, [...values, page]);

  return [
    rows.map((x) => recursiveToCamel(x) as Challenge),
    rows[0] ? rows[0].count : 0,
  ];
};

const count = async () => {
  const { rows } = await query("SELECT COUNT(*) FROM challanges", []);

  return rows[0];
};

// const getAllByStatus = async () => {
//   const { rows } = await query(
//     `select ticket_status."name", count(tickets.id) from tickets right join ticket_status on tickets.ticket_status = ticket_status.id  group by ticket_status."name"`,
//     [],
//   );

//   return rows;
// };

const ChallengeModal = {
  create,
  getById,
  // getAll,
  // getOne,
  // getMany,
  updateById,
  deleteById,
  // getByEmail,
  // getAllByStatus,
  search,
  count,
};

export default ChallengeModal;

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
