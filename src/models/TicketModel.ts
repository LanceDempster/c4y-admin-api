import { query } from "../db";
import { Ticket } from "../interfaces/Ticket";
import { TicketSearch } from "../schemas/TicketSearch";

export const create = async (ticket: Ticket) => {
  const queryText =
    "INSERT INTO tickets(\
    user_id, \
    staff_id, \
    staff_name, \
    user_email, \
    ticket_title, \
    description, \
    ticket_category_id, \
    ticket_priority_id, \
    ticket_status) \
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";

  const { rows } = await query(queryText, [
    ticket.userId,
    ticket.staffId,
    ticket.staffName,
    ticket.userEmail,
    ticket.title,
    ticket.description,
    ticket.categoryId,
    ticket.priorityId,
    ticket.statusId,
  ]);

  const res: Ticket = recursiveToCamel(rows[0]);

  return res;
};

// export const getById = async (id: number) => {
//     const {rows} = await query('SELECT * FROM ticket_status WHERE id=$1', [id])

//     if (!rows[0]) {
//         return undefined
//     }

//     const ticketStatus: Ticket = recursiveToCamel(rows[0]);
//     return ticketStatus;
// }

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

// export const deleteById = async (id: number) => {
//     await query('DELETE FROM ticket_status WHERE id=$1', [id]);
//     return
// }

// export const updateById = async (id: number, newProps: any) => {

//     const querys: string[] = [];
//     const values: any[] = [];

//     let i = 2;
//     for (const [key, value] of Object.entries(newProps)) {
// 				if (value === ""){

// 				} else if (!value) continue;

//         if (key === "user" || key === "token")
//             continue

//         querys.push(camleToSnake(key) + '=' + '$' + i);
//         values.push(value);
//         i++;
//     }

//     const queryText = `UPDATE ticket_status
//                        SET ${querys.join(',')}
//                        WHERE id = $1 RETURNING *`

//     const {rows} = await query(queryText, [id, ...values]);

//     const ticketStatus: TicketStatus = recursiveToCamel(rows[0])
//     return ticketStatus;
// }

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
  for (let [key, value] of Object.entries(props)) {
    if (value === "undefined") continue;
    if (!value) continue;

    if (key === "userId") {
      value = parseInt(value.toString());
    } else if (key === "title") {
      key = "ticketTitle";
    } else if (key === "description") {
      key = "tickets.description";
    } else if (key === "categoryId") {
      key = "ticketCategoryId";
      value = parseInt(value.toString());
    } else if (key === "statusId") {
      key = "ticketStatus";
      value = parseInt(value.toString());
    } else if (key === "priorityId") {
      key = "ticketPriorityId";
      value = parseInt(value.toString());
    }

    if (typeof value === "string") {
      querys.push(`${camleToSnake(key)} LIKE $${i}`);
      values.push(`%${value}%`);
    } else if (typeof value === "number") {
      querys.push(`${camleToSnake(key)} = $${i}`);
      values.push(value);
    }
    i++;
  }

  let queryText = `
    SELECT tickets.*, 
           ticket_category.name AS category_name, 
           ticket_priority.name AS priority_name,
           ticket_status.name AS status_name,
           count(*) OVER () AS count
    FROM tickets
    LEFT JOIN ticket_category ON ticket_category_id = ticket_category.id
    LEFT JOIN ticket_status ON ticket_status = ticket_status.id
    LEFT JOIN ticket_priority ON ticket_priority_id = ticket_priority.id
    ${querys.length ? "WHERE " + querys.join(" OR ") : ""}
    ORDER BY tickets.id ASC
    LIMIT 10
    OFFSET (($${i} - 1) * 10)
  `;

  if (page < 1) page = 1;

  const { rows } = await query(queryText, [...values, page]);

  return [
    rows.map((x) => recursiveToCamel(x) as Ticket),
    rows[0] ? rows[0].count : 0,
  ];
};

const count = async () => {
  const { rows } = await query("SELECT COUNT(*) FROM tickets", []);

  return rows[0];
};

const TicketModal = {
  create,
  // getById,
  // getAll,
  // getOne,
  // getMany,
  // updateById,
  // deleteById,
  // getByEmail,
  search,
  count,
};

export default TicketModal;

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
