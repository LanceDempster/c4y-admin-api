import {query} from "../db";
import {DeviceType} from "../interfaces/DeviceType";
import {LockType} from "../interfaces/LockType";
import {Punishment} from "../interfaces/Punishment";
import {Reward} from "../interfaces/Reward";
import {Toy} from "../interfaces/Toy";
import {User} from "../interfaces/User";
import {UserProductFull} from "../interfaces/UserProductFull";
import {DiaryType} from "../interfaces/DiaryType";
import {compare, hash} from "bcrypt";
import {isValidPassword} from "../utils/helperFunctions";
import {Ticket} from "../interfaces/Ticket";
import assert from "node:assert";
import BadRequest from "../errors/BadRequest";
import UserGame from "../schemas/UserGame";

export const create = async (user: User, productCode: number, next: any) => {
  try {
    const {rows: productCodeRows} = await query(
      "SELECT product_code FROM register_product_code WHERE code = $1 AND used = false",
      [productCode],
    );

    if (productCodeRows.length < 1) {
      return next(new BadRequest("Product code is invalid"));
    }

    // Check if the username already exists
    const {rows: existingUsername} = await query(
      "SELECT username FROM users WHERE username = $1",
      [user.username],
    );

    if (existingUsername.length > 0) {
      return next(new BadRequest("Username is already taken"));
    }

    // Check if the email already exists
    const {rows: existingEmail} = await query(
      "SELECT email FROM users WHERE email = $1",
      [user.email],
    );

    if (existingEmail.length > 0) {
      return next(new BadRequest("Email is already registered"));
    }

    // Get the starting level and rank
    const {rows: startingLevel} = await query(
      'SELECT id FROM levels ORDER BY "order" ASC LIMIT 1',
      [],
    );

    const {rows: startingRank} = await query(
      'SELECT id FROM ranks ORDER BY "order" ASC LIMIT 1',
      [],
    );

    const queryText =
      "INSERT INTO users (\
                first_name, \
                last_name, \
                username, \
                email, \
                password, \
                password_create_date, \
                country, \
                date_of_birth, \
                account_status, \
                account_create_date, \
                email_validation, \
                timezone, \
                gender, \
                level_id, \
                rank_id) \
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *";

    const {rows: userRows} = await query(queryText, [
      user.firstName,
      user.lastName,
      user.username,
      user.email,
      user.password,
      user.passwordCreateDate,
      user.country,
      user.dateOfBirth,
      user.accountStatus,
      user.accountCreateDate,
      user.emailValidation,
      user.timezone,
      user.gender,
      startingLevel[0].id,
      startingRank[0].id,
    ]);

    let insertedUser = userRows[0];

    await query(
      "INSERT INTO user_product (user_id, product_code) VALUES ($1, $2)",
      [insertedUser.id, productCodeRows[0].product_code],
    );

    await query(
      "UPDATE register_product_code SET used = true WHERE code = $1",
      [productCode],
    );

    await query("UPDATE users SET xp_points = 5000 WHERE id = $1", [
      insertedUser.id,
    ]);

    await query(
      "INSERT INTO xp_change (amount, reason, date, user_id) VALUES ($1, $2, $3, $4)",
      [5000, "Initial signup bonus", new Date(), insertedUser.id],
    );

    await query(
      "INSERT INTO dairy (user_id, created_date, title, entry, type, product) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        insertedUser.id,
        new Date(),
        "Welcome Bonus",
        "You received 5000 points as a welcome bonus for signing up!",
        "c",
        productCodeRows[0].product_code,
      ],
    );

    const res: User = recursiveToCamel(insertedUser);

    return res;
  } catch (error) {
    console.log(error);
    // Handle unexpected errors
    return next(new BadRequest("An unexpected error occurred"));
  }
};

export const getById = async (id: number = 0) => {
  const {rows} = await query(
    `SELECT users.*,
            user_settings.user_url,
            user_settings.avatar_url,
            l."order" as level_order,
            l.name    as level_name,
            r."order" as rank_order,
            r.name    as rank_name
     FROM users
              left join user_settings on users.id = user_settings.user_id
              left join levels l on users.level_id = l.id
              left join ranks r on users.rank_id = r.id
     WHERE users.id = $1`,
    [id],
  );

  if (!rows[0]) {
    return undefined;
  }

  const user: User = recursiveToCamel(rows[0]);
  return user;
};

export const getAll = async () => {
  const {rows} = await query("SELECT * FROM users", []);
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

  const {rows} = await query(
    `SELECT *, product.id as product_id, count(*) OVER () AS count
     FROM user_product
              inner join product on user_product.product_code = product.product_code
     WHERE user_product.user_id = ($1)
     ORDER BY id ASC
     LIMIT 10 OFFSET (($2 - 1) * 10)`,
    [userId, page],
  );

  return [
    rows.map((x) => recursiveToCamel(x) as UserProductFull),
    rows[0] ? rows[0].count : 0,
  ];
};

export const getByEmail = async (email: string) => {
  const {rows} = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);

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
    if (value === "") {
    } else if (!value) continue;
    if (key === "user" || key === "token") continue;

    querys.push(camleToSnake(key) + "=" + "$" + i);
    values.push(value);
    i++;
  }

  const queryText = `UPDATE users
                     SET ${querys.join(",")}
                     WHERE id = $1
                     RETURNING *`;

  const {rows} = await query(queryText, [id, ...values]);

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

  const {rows} = await query(queryText, [...values]);

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

  const {rows} = await query(queryText, [...values]);

  return rows.map((x) => recursiveToCamel(x) as User);
};

// the implementation of the function to filter the users following the general style of the project
export const getTotalActiveUsers = async () => {
  const {rows} = await query(
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
                   LIMIT 10 OFFSET (($${i} - 1) * 10)`;

  if (values.length === 0) {
    queryText = queryText.replace("WHERE", "");
  }

  if (page < 1) page = 1;

  const {rows} = await query(queryText, [...values, page]);

  return [
    rows.map((x) => recursiveToCamel(x) as User),
    rows[0] ? rows[0].count : 0,
  ];
};

const count = async () => {
  const {rows} = await query("SELECT COUNT(*) FROM users", []);

  return rows[0];
};

const getSettings = async (id: string) => {
  const {rows} = await query(
    "SELECT * FROM user_settings WHERE user_id = $1",
    [id],
  );

  if (!rows[0]) return undefined;

  const userSettings = recursiveToCamel(rows[0]);

  return userSettings;
};

const ifNoUserSettingsCreate = async (userId: number) => {
  const {rows} = await query(
    "SELECT * FROM user_settings WHERE user_id = $1",
    [userId],
  );

  if (rows.length === 0) {
    // User ID not found, create a new row
    await query("INSERT INTO user_settings (user_id) VALUES ($1)", [userId]);
  }
};

const updateSettings1 = async ({
  community,
  gameMessages,
  marketingMessages,
  keyHolder,
  userStories,
  id,
}: {
  community: boolean;
  gameMessages: boolean;
  marketingMessages: boolean;
  keyHolder: boolean;
  userStories: boolean;
  id: number;
}) => {
  ifNoUserSettingsCreate(id);

  const queryText = `UPDATE user_settings
                     SET community            = $2,
                         game_messages        = $3,
                         marketing_messages   = $4,
                         keyholder            = $5,
                         user_story           = $6,
                         product_setup_status = 2
                     WHERE user_id = $1
                     RETURNING *`;

  const {rows} = await query(queryText, [
    id,
    community,
    gameMessages,
    marketingMessages,
    keyHolder,
    userStories,
  ]);

  return true;
};

const updateSettings1v2 = async ({
  community,
  gameMessages,
  marketingMessages,
  keyHolder,
  userStories,
  id,
}: {
  community: boolean;
  gameMessages: boolean;
  marketingMessages: boolean;
  keyHolder: boolean;
  userStories: boolean;
  id: number;
}) => {
  const queryText = `UPDATE user_settings
                     SET community          = $2,
                         game_messages      = $3,
                         marketing_messages = $4,
                         keyholder          = $5,
                         user_story         = $6
                     WHERE user_id = $1
                     RETURNING *`;

  const {rows} = await query(queryText, [
    id,
    community,
    gameMessages,
    marketingMessages,
    keyHolder,
    userStories,
  ]);

  return true;
};

const updateSettings2 = async ({id}: { id: number }) => {
  const {rows} = await query(
    `SELECT product_code
     FROM user_product
     WHERE user_id = $1`,
    [id],
  );

  // Check if the user already has a diary entry
  const {rowCount} = await query(
    `SELECT 1
     FROM dairy
     WHERE user_id = $1`,
    [id],
  );

  if (rowCount === 0) {
    const {rows} = await query(
      `SELECT product_code
       FROM user_product
       where user_id = $1`,
      [id],
    );

    const queryText = `update user_settings
                       set product_setup_status = 2
                       where user_id = $1
                       RETURNING *`;

    await query(queryText, [id]);

    const queryText2 = `
        INSERT INTO dairy
            (user_id, created_date, title, entry, type, product)
        VALUES ($1, $2, $3, $4, $5, $6)`;

    await query(queryText2, [
      id,
      new Date(),
      "Diary Started",
      "The day the user setup his diary",
      "c",
      rows[0]["product_code"],
    ]);
  }

  return true;
};

const updateSettings3 = async ({
  id,
  deviceIds,
}: {
  id: number;
  deviceIds: number[];
}) => {
  // Delete current user devices
  const deleteQueryText = `DELETE
                           FROM user_device_type
                           WHERE user_id = $1`;
  await query(deleteQueryText, [id]);

  const queryText = `update user_settings
                     set product_setup_status = 2
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id]);

  const queryText2 = `INSERT INTO user_device_type (user_id, device_type)
                      values ($1, $2)
                      RETURNING *`;

  deviceIds.forEach(async (deviceId) => {
    await query(queryText2, [id, deviceId]);
  });

  return true;
};

const updateSettings4 = async ({
  id,
  lockIds,
}: {
  id: number;
  lockIds: number[];
}) => {
  // Delete current user devices
  const deleteQueryText = `DELETE
                           FROM user_lock_type
                           WHERE user_id = $1`;
  await query(deleteQueryText, [id]);

  const queryText = `update user_settings
                     set product_setup_status = 3
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id]);

  const queryText2 = `INSERT INTO user_lock_type (user_id, lock_type_id)
                      values ($1, $2)
                      RETURNING *`;

  lockIds.forEach(async (lockId) => {
    await query(queryText2, [id, lockId]);
  });

  return true;
};

const updateSettings5 = async ({
  id,
  rewardsIds,
}: {
  id: number;
  rewardsIds: number[];
}) => {
  // Delete current user devices
  const deleteQueryText = `DELETE
                           FROM user_rewards
                           WHERE user_id = $1`;
  await query(deleteQueryText, [id]);

  const queryText = `update user_settings
                     set product_setup_status = 4
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id]);

  const queryText2 = `INSERT INTO user_rewards (user_id, reward_id)
                      values ($1, $2)
                      RETURNING *`;

  rewardsIds.forEach(async (rewardId) => {
    await query(queryText2, [id, rewardId]);
  });

  return true;
};

const updateSettings6 = async ({
  id,
  punishmentsIds,
}: {
  id: number;
  punishmentsIds: number[];
}) => {
  // Delete current user devices
  const deleteQueryText = `DELETE
                           FROM user_punishments
                           WHERE user_id = $1`;
  await query(deleteQueryText, [id]);

  const queryText = `update user_settings
                     set product_setup_status = 5
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id]);

  const queryText2 = `INSERT INTO user_punishments (user_id, punishment_id)
                      values ($1, $2)
                      RETURNING *`;

  punishmentsIds.forEach(async (punishmentId) => {
    await query(queryText2, [id, punishmentId]);
  });

  return true;
};

const updateSettings7 = async ({
  id,
  toysIds,
}: {
  id: number;
  toysIds: number[];
}) => {
  // Delete current user devices
  const deleteQueryText = `DELETE
                           FROM user_toys
                           WHERE user_id = $1`;
  await query(deleteQueryText, [id]);

  const queryText = `update user_settings
                     set product_setup_status = 6
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id]);

  const queryText2 = `INSERT INTO user_toys (user_id, toy_id)
                      values ($1, $2)
                      RETURNING *`;

  toysIds.forEach(async (toyId) => {
    await query(queryText2, [id, toyId]);
  });

  return true;
};

const updateSettings8 = async ({
  id,
  maximum,
  minimum,
}: {
  id: number;
  maximum: number;
  minimum: number;
}) => {
  const queryText = `update user_settings
                     set product_setup_status = 7,
                         min_time             = $3,
                         max_time             =
                             $2
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id, maximum, minimum]);

  return true;
};

const updateSettings9 = async ({
  id,
  keyStorage,
}: {
  id: number;
  keyStorage: number;
}) => {
  const queryText = `update user_settings
                     set product_setup_status = 8,
                         key_storage          = $2
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id, keyStorage]);

  return true;
};

const updateSettings10 = async ({
  id,
  fileLocation,
}: {
  id: number;
  fileLocation: string;
}) => {
  const queryText = `update user_settings
                     set product_setup_status = 9,
                         user_url             = $2
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id, fileLocation]);

  return true;
};

const updateSettings11 = async ({
  id,
  fileLocation,
}: {
  id: number;
  fileLocation: string;
}) => {
  const queryText = `update user_settings
                     set product_setup_status = 10,
                         avatar_url           = $2
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id, fileLocation]);

  return true;
};

const updateProfilePicture = async ({
  id,
  fileLocation,
}: {
  id: number;
  fileLocation: string;
}) => {
  const queryText = `update user_settings
                     set user_url = $2
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id, fileLocation]);

  return true;
};

const updateAvatarPicture = async ({
  id,
  fileLocation,
}: {
  id: number;
  fileLocation: string;
}) => {
  const queryText = `update user_settings
                     set avatar_url = $2
                     where user_id = $1
                     RETURNING *`;

  await query(queryText, [id, fileLocation]);

  return true;
};

const getUserDevices = async (id: string) => {
  const {rows} = await query(
    `SELECT *
     FROM user_device_type
              left join device_type on user_device_type.device_type = device_type.id
     WHERE user_id = $1`,
    [id],
  );

  if (!rows[0]) return undefined;

  return rows.map((x) => recursiveToCamel(x) as DeviceType);
};

const getUserTickets = async (id: string) => {
  const {rows} = await query(
    `SELECT tickets.*, ticket_status.name as ticket_status_name
     FROM tickets
              left join ticket_status on tickets.ticket_status = ticket_status.id
     WHERE user_id = $1
     order by ticket_status
    `,
    [id],
  );

  if (!rows[0]) return undefined;

  return rows.map((x) => recursiveToCamel(x) as Ticket);
};

const getUserLocks = async (id: string) => {
  const {rows} = await query(
    `SELECT *
     FROM user_lock_type
              left join lock_type on user_lock_type.lock_type_id = lock_type.id
     WHERE user_id = $1`,
    [id],
  );

  if (!rows[0]) return undefined;

  return rows.map((x) => recursiveToCamel(x) as LockType);
};

const getUserRewards = async (id: string) => {
  const {rows} = await query(
    `SELECT *
     FROM user_rewards
              left join rewards on user_rewards.reward_id = rewards.id
     WHERE user_id = $1`,
    [id],
  );

  if (!rows[0]) return undefined;

  return rows.map((x) => recursiveToCamel(x) as Reward);
};

const getUserPunishments = async (id: string) => {
  const {rows} = await query(
    `SELECT *
     FROM user_punishments
              left join punishments on user_punishments.punishment_id = punishments.id
     WHERE user_id = $1`,
    [id],
  );

  if (!rows[0]) return undefined;

  return rows.map((x) => recursiveToCamel(x) as Punishment);
};

const getUserToys = async (id: string) => {
  const {rows} = await query(
    `SELECT *
     FROM user_toys
              left join toys on user_toys.toy_id = toys.id
     WHERE user_id = $1`,
    [id],
  );

  if (!rows[0]) return undefined;

  return rows.map((x) => recursiveToCamel(x) as Toy);
};

const getDiary = async (date: string, id: string) => {
  const {rows} = await query(
    `SELECT *
     FROM dairy
     WHERE date_trunc('day', dairy.created_date) = $1
       and user_id = $2
     order by created_date
    `,
    [date, id],
  );

  if (!rows[0]) return undefined;

  return rows.map((x) => recursiveToCamel(x) as any);
};

const addDiary = async (diary: DiaryType) => {
  if (
    await query(
      "INSERT INTO dairy (user_id, created_date, title, entry, type, product) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        diary.userId,
        diary.createdDate,
        diary.title,
        diary.entry,
        diary.type,
        diary.productCode,
      ],
    )
  ) {
    return 1;
  } else {
    return -1;
  }
};

const addTicket = async (
  userId: number,
  userEmail: string,
  title: string,
  description: string,
  category: number,
) => {
  if (
    await query(
      `INSERT INTO tickets (user_id, user_email, ticket_title, description, ticket_category_id,
                            ticket_priority_id,
                            ticket_status)
       VALUES ($1, $2, $3, $4, $5,
               (SELECT id FROM ticket_priority WHERE name = 'Medium'),
               (SELECT id FROM ticket_status WHERE name = 'Open'));`,
      [userId, userEmail, title, description, category],
    )
  ) {
    return 1;
  } else {
    return -1;
  }
};

const updateDiary = async (
  title: string,
  entry: string,
  diaryId: string,
  userId: string,
) => {
  if (
    await query(
      "UPDATE dairy SET title = $1, entry = $2 where id = $3 and user_id = $4",
      [title, entry, diaryId, userId],
    )
  ) {
    return 1;
  } else {
    return -1;
  }
};

export const deleteDiary = async (id: number) => {
  await query("DELETE FROM dairy WHERE id=$1", [id]);
  return;
};

const updateUserProfile = async ({
  id,
  firstName,
  lastName,
  gender,
  dateOfBirth,
  country,
  timezone,
}: {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  country: string;
  timezone: string;
}) => {
  const queryText = `update users
                     set first_name    = $2,
                         last_name     = $3,
                         gender        = $4,
                         date_of_birth = $5,
                         country       = $6,
                         timezone      = $7
                     where id = $1
                     RETURNING *`;

  await query(queryText, [
    id,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    country,
    timezone,
  ]);

  return true;
};

const userChangePassword = async ({
  id,
  oldPassword,
  newPassword,
}: {
  id: number;
  oldPassword: string;
  newPassword: string;
}) => {
  const {rows} = await query(
    `select password
     from users
     where id = $1`,
    [id],
  );

  if (!(await compare(oldPassword, rows[0]["password"]))) {
    throw new Error("Wrong password");
  }

  let passwordValidity = isValidPassword(newPassword);

  if (!passwordValidity["isValid"]) {
    throw new Error(passwordValidity["message"]);
  }

  newPassword = await hash(newPassword, 10);

  let res = await query(
    `update users
     set password = $2
     where id = $1
     RETURNING *`,
    [id, newPassword],
  );

  return true;
};

const userChangeEmail = async ({
  id,
  newEmail,
}: {
  id: number;
  newEmail: string;
}) => {
  let res = await query(
    `update users
     set email = $2
     where id = $1
     RETURNING *`,
    [id, newEmail],
  );

  let res0 = await query(
    `INSERT INTO user_email_history (user_id, email)
     VALUES ($1, $2)`,
    [id, newEmail],
  );

  return true;
};

const toggleStatus = async ({
  userId,
  ticketId,
}: {
  userId: number;
  ticketId: number;
}) => {
  const queryText = `
      WITH current_status AS (SELECT ts.name
                              FROM tickets t
                                       JOIN ticket_status ts ON t.ticket_status = ts.id
                              WHERE t.user_id = $1
                                AND t.id = $2),
           status_update AS (SELECT id
                             FROM ticket_status
                             WHERE name = (CASE
                                               WHEN (SELECT name FROM current_status) = 'Closed' THEN 'Open'
                                               ELSE 'Closed'
                                 END))
      UPDATE tickets
      SET ticket_status = (SELECT id FROM status_update)
      WHERE user_id = $1
        AND id = $2
      RETURNING *`;

  await query(queryText, [userId, ticketId]);

  return true;
};


const getUserGames = async ({userId}: { userId: number }): Promise<UserGame[]> => {
  let game = await fetchUserGames(userId);

  if (!game) return []

  const xpPerDay = await fetchDailyLockXP();

  await checkEvents(game, userId);

  game = await dailyLockXpCheck(game, userId, xpPerDay);
  game = await failedVerificationsCheck(game, userId);
  game = await checkRankUp(game, userId);

  return [game];
};

function getDatesBetween(startDate: Date, endDate: Date) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = new Date(currentDate.getTime() + 86400 * 1000);
  }

  return dates;
}

// Function to calculate overlapping hours between two date ranges
// Step 1: Define the type for the date range
type DateRange = {
  startDate: Date;
  endDate: Date;
};

// Step 2: Function to calculate the overlap between two date ranges
function calculateOverlapHours(range1: DateRange, range2: DateRange): number {
  const start = new Date(Math.max(range1.startDate.getTime(), range2.startDate.getTime()));
  const end = new Date(Math.min(range1.endDate.getTime(), range2.endDate.getTime()));

  if (start < end) {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
  }
  return 0;
}

// Step 3: Function to calculate the total overlap hours with a single date range
function totalOverlapHours(dateRanges: DateRange[], singleRange: DateRange): number {
  return dateRanges.reduce((total, range) => {
    return total + calculateOverlapHours(range, singleRange);
  }, 0);
}

const checkEvents = async (game: UserGame, userId: number): Promise<void> => {
  /*
    - get all user events where status is running
    - check each event to see if end date has passed
    - calculate if the user has been locked on every day how many hours he has been locked
    - compare with event levels hours required
    - set user_event_status to either failed or completed
    - if completed then set status to that and add level_id as well
    - if completed then add xp from event_level xp
    - add diary entry to everything that happened
   */

  const currentDate = new Date();

  const {rows: userRunningEvents} = await query(`
      SELECT *
      FROM user_event
               left join event e on user_event.event_code = e.event_code
      WHERE user_id = $1
        AND status = 'running'
  `, [userId])

  for (const event of userRunningEvents) {
    if (currentDate > event["end_date"]) {

      let skip1stDay = true;
      let lockedDays = [];
      for (let day of getDatesBetween(new Date(event["start_date"]), new Date(event["end_date"]))) {

        if (skip1stDay) {
          skip1stDay = false
          continue
        }

        day = new Date(day);

        let lastDay = new Date(day.getTime() - 86400 * 1000);

        // handle failed games
        const {rows} = await query("SELECT * FROM user_solo_games WHERE start_date < $1 AND (end_date IS null OR (end_date > $2)) and user_id = $3 and (game_status = 'In Game' or game_success = true)", [day, lastDay, userId])

        let totalHours = totalOverlapHours(rows.map((game): DateRange => {
          return {
            startDate: game.start_date,
            endDate: game.end_date > new Date() ? new Date() : game.end_date,
          }
        }), {startDate: lastDay, endDate: day});

        lockedDays.push({
          day: lastDay,
          hours: totalHours
        })
      }

      let minimumHours = 24;

      for (const lockedDay of lockedDays) {
        if (lockedDay.hours < minimumHours) {
          minimumHours = lockedDay.hours;
        }
      }


      const {rows: levels} = await query("select * from event_level where event_code = $1 order by hours desc", [event.event_code]);

      let levelIndex: number | null = 0;
      let i = 0;
      let totalLevels = levels.length;

      while (lockedDays.length > i) {
        if (lockedDays[i].hours < levels[levelIndex]["hours"]) {

          if (levelIndex + 1 === totalLevels) {
            levelIndex = null;
            break;
          } else {
            levelIndex++;
          }

          continue;
        }

        i++;
      }

      if (levelIndex !== null) {
        await query(`UPDATE user_event
                     SET status         = 'completed',
                         event_level_id = $2
                     WHERE event_code = $1`, [event.event_code, levels[levelIndex]["id"]]);


        await handleDeltaXp(userId, levels[levelIndex]["xp"], `User got ${levels[levelIndex]["name"]} in ${event.name}`, new Date(), null);

        const eventColumnMap: Record<string, string> = {
          "Locktober": "total_events_october",
          "No Nut November": "total_events_november",
          "Denial December": "total_events_december",
        };

        const column: string = eventColumnMap[event["name"]] || "total_events_other";

        await query(`
                    UPDATE tracker
                    SET total_events = total_events + 1,
                        ${column}    = ${column} + 1
                    WHERE user_id = $1`,
          [userId]
        );

        await query(`
            INSERT INTO dairy (user_id, created_date, title, entry, type)
            VALUES ($1, $2, $3, $4, 'c')
        `, [userId, new Date(), `${event.name} Success`, `You have successfully finished ${event.name} with ${levels[levelIndex]["name"]} Medal`])

      } else {
        await query(`UPDATE user_event
                     SET status = 'completed'
                     WHERE event_code = $1`, [event.event_code]);

        const eventColumnMap: Record<string, string> = {
          "Locktober": "total_events_october",
          "No Nut November": "total_events_november",
          "Denial December": "total_events_december",
        };

        const column: string = eventColumnMap[event["name"]] || "total_events_other";

        await query(`
                    UPDATE tracker
                    SET total_events        = total_events + 1,
                        ${column}           = ${column} + 1,
                        total_events_failed = total_events_failed + 1
                    WHERE user_id = $1`,
          [userId]
        );

        await query(`
            INSERT INTO dairy (user_id, created_date, title, entry, type)
            VALUES ($1, $2, $3, $4, 'c')
        `, [userId, new Date(), `${event.name} Fail`, `You have failed to finish ${event.name}`])
      }

    }
  }


}

const checkRankUp = async (game: UserGame, userId: number): Promise<UserGame> => {
  /*
    - get user rank
    - get user next rank, level
    - calculate user current consecutiveDays
    - get all user unlocked achievements
    - check each with requirement
   */

  // get user rank
  const {rows: userData} = await query(
    `SELECT rank_id, level_id, ranks."order" as rank_order, levels."order" as level_order
     FROM users
              left join ranks on users.rank_id = ranks.id
              left join levels on users.level_id = levels.id
     where users.id = $1`,
    [userId],
  );

  // get get user next rank
  const {rows: nextRank} = await query(
    `SELECT *
     FROM ranks
     WHERE "order" = $1`
    , [userData[0]["rank_order"] + 1]
  )

  // calculate consecutive days
  let consecutiveDays = Math.floor(new Date().getTime() - new Date(game.start_date).getTime()) / 1000 / 60 / 60 / 24

  let userAchievements = await getUserAchievements(userId)
  userAchievements = userAchievements.filter((x) => x.unlockedDate != null).map((x) => x.id);

  let levelOrder = userData[0]["level_order"]

  let requiredLevel = nextRank[0]["requirements"]["level"]
  let requiredAchievements = nextRank[0]["requirements"]["achievements"]
  let requiredDays = nextRank[0]["requirements"]["consecutiveDays"]

  let includesAll = (arr: any[], target: any[]) => target.every(v => arr.includes(v));

  if (
    consecutiveDays >= requiredDays
    &&
    includesAll(userAchievements, requiredAchievements)
    &&
    levelOrder >= requiredLevel
  ) {
    await query(
      `UPDATE users
       SET rank_id = $1
       WHERE id = $2`,
      [nextRank[0]["id"], userId]
    )
  }

  return game
}

/* fetch game function */
const fetchUserGames = async (userId: number): Promise<UserGame> => {
  const {rows} = await query(`
      SELECT user_solo_games.*,
             cheater_punishment.id             as cheater_wheel_id,
             p1.name                           as punishment1Name,
             p2.name                           as punishment2Name,
             p3.name                           as punishment3Name,
             p4.name                           as punishment4Name,
             p5.name                           as punishment5Name,
             gvs.regularity,
             gvs.punishment_time,
             (SELECT image_url
              FROM game_verification_image
              WHERE game_id = user_solo_games.id
              ORDER BY date DESC
              LIMIT 1)                         as latest_verification_image,
             (SELECT date
              FROM game_verification_image
              WHERE game_id = user_solo_games.id
              ORDER BY date DESC
              LIMIT 1)                         as latest_verification_time,
             (SELECT date
              FROM xp_change
              WHERE user_id = user_solo_games.user_id
                AND game_id = user_solo_games.id
                AND reason = 'Daily Locked Award'
              ORDER BY date DESC
              LIMIT 1)                         AS last_xp_award_date,
             (SELECT date
              FROM xp_change
              WHERE user_id = user_solo_games.user_id
                AND game_id = user_solo_games.id
                AND (reason = 'Missed Image Verification'
                  OR reason = 'Image Verification')
              ORDER BY date DESC
              LIMIT 1)                         AS last_verification_event_date,
             upt.start_date                    AS pause_start_date,
             upt.end_date                      AS pause_end_date,
             pause_game.time                   AS pause_time,
             pause_game.max_time_before_cancel AS max_pause_time,
             EXISTS (SELECT 1
                     FROM user_event ue
                              JOIN event e ON ue.event_code = e.event_code
                     WHERE ue.user_id = user_solo_games.user_id
                       AND e.end_date > NOW()) AS is_active_event,
             EXISTS (SELECT 1
                     FROM public.user_adventure ua
                              JOIN adventure a ON ua.adventure_code = a.adventure_code
                     WHERE ua.user_id = user_solo_games.user_id
                       and ua.status is null)  AS is_active_adventure
      FROM user_solo_games
               LEFT JOIN cheater_punishment
                         ON user_solo_games.id = cheater_punishment.game_id AND cheater_punishment.state = 1
               LEFT JOIN punishments p1 ON punishment1id = p1.id
               LEFT JOIN punishments p2 ON punishment2id = p2.id
               LEFT JOIN punishments p3 ON punishment3id = p3.id
               LEFT JOIN punishments p4 ON punishment4id = p4.id
               LEFT JOIN punishments p5 ON punishment5id = p5.id
               LEFT JOIN game_verification_settings gvs ON user_solo_games.id = gvs.game_id
               LEFT JOIN user_pause_table upt ON user_solo_games.id = upt.game_id and upt.end_date is null
               LEFT JOIN pause_game ON upt.pause_id = pause_game.id
      WHERE user_solo_games.user_id = $1
        AND (user_solo_games.game_status = 'In Game' OR user_solo_games.game_status = 'paused')
  `, [userId]);

  // Adjust the end date for paused games
  const game = rows[0];
  if (game && game.game_status === 'paused' && game.pause_start_date) {
    const now = new Date();
    const pauseStart = new Date(game.pause_start_date);
    const pauseDuration = now.getTime() - pauseStart.getTime();

    // Add the pause duration to both end_date and original_end_date
    game.end_date = new Date(new Date(game.end_date).getTime() + pauseDuration);
  }

  return game;
};

const fetchDailyLockXP = async (): Promise<number> => {
  const {rows} = await query(`
      SELECT amount
      FROM action_points
      WHERE title = 'Daily Lock XP'
  `, []);
  return rows[0]?.amount || 0;
};

const dailyLockXpCheck = async (game: UserGame, userId: number, xpPerDay: number): Promise<UserGame> => {
  const startDate = new Date(game.start_date);
  const currentDate = new Date();
  const lastXpAwardDate = new Date(game.last_xp_award_date ?? game.start_date);

  const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLastAward = Math.floor((currentDate.getTime() - lastXpAwardDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceStart > 0 && daysSinceLastAward > 0) {

    for (let i = 0; i < daysSinceLastAward; i++) {
      const date = new Date(lastXpAwardDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);

      await handleDeltaXp(userId, xpPerDay, "Daily Locked Award", date, game.id);

      await query(`
          INSERT INTO dairy (user_id, created_date, title, entry, type, game_id)
          VALUES ($1, $2, $3, $4, 'c', $5)
      `, [userId, date, "Daily Lock XP Awarded", `You earned ${xpPerDay} XP for being locked for another day.`, game.id]);
    }

    game.xpAwarded = xpPerDay * daysSinceLastAward;
    game.daysAwarded = daysSinceLastAward;
  }

  return game;
};

const handleDeltaXp = async (userId: number, amount: number, reason: string, date: Date, gameId: number | null, actionPointId?: number): Promise<number> => {
  const {rows: userData} = await query(`
      SELECT users.*, l."order" as levelOrder
      FROM users
               left join public.levels l on users.level_id = l.id
      WHERE users.id = $1
  `, [userId])

  await query(`
      INSERT INTO xp_change (user_id, amount, reason, date, game_id, action_points_id)
      VALUES ($1, $2, $3, $4, $5, $6)
  `, [userId, amount, reason, date, gameId, actionPointId]);

  const {rows: userLevel} = await query(`
      UPDATE users
      SET xp_points = GREATEST(0, xp_points + $1),
          level_id  = (SELECT id
                       FROM levels
                       WHERE requiredpoints <= GREATEST(users.xp_points + $1, 0)
                       ORDER BY requiredpoints desc
                       LIMIT 1)
      WHERE id = $2
      returning level_id
  `, [amount, userId]);

  return userLevel[0]["levelOrder"] - userData[0]["levelOrder"]
};

const failedVerificationsCheck = async (game: UserGame, userId: number): Promise<UserGame> => {
  if (game.regularity && game.punishment_time) {
    const startDate = new Date(game.start_date);
    const currentDate = new Date();
    const lastEventDate = new Date(game.last_verification_event_date ?? game.start_date);

    const daysSinceStartOrLastPunishmentOrReward = Math.floor((currentDate.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
    const windows = Math.floor(daysSinceStartOrLastPunishmentOrReward / game.regularity);

    let newPunishments = 0;
    let punishedWindows = [];

    for (let i = 0; i < windows; i++) {
      const windowStartDate = new Date(startDate.getTime() + i * game.regularity * 24 * 60 * 60 * 1000);
      const windowEndDate = new Date(windowStartDate.getTime() + game.regularity * 24 * 60 * 60 * 1000);

      const verificationExists = await checkVerification(game.id, windowStartDate, windowEndDate);
      const punishmentExists = await checkPunishment(game.id, windowStartDate, windowEndDate);

      if (!verificationExists && !punishmentExists) {
        await applyPunishment(game, userId, windowEndDate);
        newPunishments++;
        punishedWindows.push(i + 1);
        game.punishment_count = (game.punishment_count || 0) + 1;
      }
    }

    if (newPunishments > 0) {
      game.end_date = await updateGameEndDate(game.id);
      game.new_punishments = newPunishments;
      game.punished_windows = punishedWindows;
    }
  }

  return game;
};

const checkVerification = async (gameId: number, startDate: Date, endDate: Date): Promise<boolean> => {
  const {rows} = await query(`
      SELECT *
      FROM game_verification_image
      WHERE game_id = $1
        AND date >= $2
        AND date < $3
        AND (verified IS NULL OR verified = true)
  `, [gameId, startDate, endDate]);
  return rows.length > 0;
};

const checkPunishment = async (gameId: number, startDate: Date, endDate: Date): Promise<boolean> => {
  const {rows} = await query(`
      SELECT *
      FROM game_verification_punishment
      WHERE game_id = $1
        AND date > $2
        AND date <= $3
  `, [gameId, startDate, endDate]);
  return rows.length > 0;
};

const applyPunishment = async (game: UserGame, userId: number, windowEndDate: Date): Promise<void> => {
  await query(`
      INSERT INTO game_verification_punishment (game_id, date)
      VALUES ($1, $2)
  `, [game.id, windowEndDate]);

  const {rows: actionPointRows} = await query(
    "SELECT amount FROM action_points WHERE title = 'Missed Verification'"
    , []
  )

  const xpLoss = actionPointRows[0]?.amount || 0
  const actionPointId = actionPointRows[0]?.id || 0

  await query(`
      INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    userId,
    windowEndDate,
    "Verification Punishment",
    `You missed a verification window and received a punishment of ${game.punishment_time} minutes added to your lock time and also lost ${Math.abs(xpLoss)}.`,
    "c",
    game.product_code,
    game.id
  ]);

  await query(`
      INSERT INTO countdown_changes (game_id, delta)
      VALUES ($1, $2)
  `, [game.id, game.punishment_time]);

  await query(`
      UPDATE user_solo_games
      SET end_date =
              CASE
                  WHEN max_lock_minutes IS NOT NULL THEN
                      LEAST(
                              now() + (max_lock_minutes * INTERVAL '1 minute'),
                              end_date + ($2 * INTERVAL '1 minute')
                      )
                  ELSE
                      end_date + ($2 * INTERVAL '1 minute')
                  END
      WHERE id = $1
  `, [game.id, game.punishment_time]);

  await handleDeltaXp(userId, xpLoss, "Missed Image Verification", windowEndDate, game.id, actionPointId)
};

/* End fetch game function */

const updateGameEndDate = async (gameId: number): Promise<string> => {
  const {rows} = await query(`
      SELECT end_date
      FROM user_solo_games
      WHERE id = $1
  `, [gameId]);
  return rows[0].end_date;
};

const addUserGame = async ({
  userId,
  seconds,
  maxLockInSeconds,
  minimumWheelPercentage,
  maximumWheelPercentage,
  imageVerificationInterval,
  imageVerificationPunishment,
  gameType,
  notes,
}: {
  userId: number;
  seconds: number | null | undefined;
  maxLockInSeconds: number | null | undefined;
  minimumWheelPercentage: number | null | undefined;
  maximumWheelPercentage: number | null | undefined;
  imageVerificationInterval: number | null | undefined;
  imageVerificationPunishment: number | null | undefined;
  gameType: string;
  notes: string;
}) => {
  const defaultGameType = "Self Countdown";
  gameType = gameType || defaultGameType;

  try {
    if (
      typeof minimumWheelPercentage === "number" &&
      typeof maximumWheelPercentage === "number"
    ) {
      assert(
        minimumWheelPercentage >= 10 &&
        minimumWheelPercentage <= maximumWheelPercentage,
        "Minimum Wheel Percentage must be more than 10 and less than Max Wheel Percentage",
      );
      assert(
        maximumWheelPercentage <= 50 &&
        maximumWheelPercentage >= minimumWheelPercentage,
        "Max Wheel Percentage must be less than 50 and more than Min Wheel Percentage",
      );
    }
  } catch (e) {
    console.error("Rolling back transaction due to errors", e);
    return -1;
  }

  try {
    const {rows} = await query(
      `SELECT product_code
       FROM user_product
       WHERE user_id = $1`,
      [userId],
    );

    let result;
    if (gameType === "Stop Watch") {
      result = await query(
        `INSERT INTO user_solo_games (user_id, game_status, game_type, start_date)
         VALUES ($1, $2, $3, now()::timestamp)
         RETURNING id`,
        [userId, "In Game", "Stop Watch"],
      );
    } else {
      if (typeof seconds !== "number") {
        throw new Error("Seconds must be a number");
      }

      result = await query(
        `INSERT INTO user_solo_games (user_id, game_status, game_type, start_date, end_date, original_end_date,
                                      minimum_wheel_percentage, maximum_wheel_percentage, max_lock_minutes)
         VALUES ($1, $2, $3, now()::timestamp, now()::timestamp + ($4 * INTERVAL '1 minute'),
                 now()::timestamp + ($4 * INTERVAL '1 minute'),
                 $5, $6, $7)
         RETURNING id`,
        [
          userId,
          "In Game",
          gameType,
          seconds / 60,
          minimumWheelPercentage,
          maximumWheelPercentage,
          maxLockInSeconds ? maxLockInSeconds / 60 : null
        ],
      );
    }

    // Get the inserted game id
    const gameId = result.rows[0].id;

    if (typeof imageVerificationInterval === "string") {
      imageVerificationInterval = parseInt(imageVerificationInterval, 10);
    }


    if (
      typeof imageVerificationInterval === "number" &&
      typeof imageVerificationPunishment === "number"
    ) {
      const result = await query(
        `INSERT INTO game_verification_settings (game_id, regularity, punishment_time)
         VALUES ($1, $2, $3)`,
        [gameId, imageVerificationInterval, imageVerificationPunishment],
      );

      if (result.rowCount === 0) {
        throw new Error("Failed to insert game verification settings");
      }
    }

    if (gameType !== "Stop Watch") {
      if (typeof seconds !== "number") {
        throw new Error("Seconds must be a number");
      }

      await query(
        "INSERT INTO countdown_changes (game_id, delta) VALUES ($1, $2)",
        [gameId, seconds / 60],
      );
    }

    // Insert into dairy and use the game id
    let diaryEntry = `Started Self-Managed game using ${gameType}`;

    if (gameType !== "Stop Watch" && seconds) {
      diaryEntry += ` for ${convertMinutesToDHM(seconds / 60)}`;
    }
    if (typeof notes === "string" && notes.trim() !== "") {
      diaryEntry += `. Notes: ${notes}`;
    }


    await query(
      `INSERT Into dairy(user_id, created_date, title, entry, type, product, game_id)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        new Date(),
        "Game Started",
        diaryEntry,
        "c",
        rows[0]["product_code"],
        gameId,
      ],
    );

    return 1;
  } catch (e) {
    console.error("Rolling back transaction due to errors", e);
    return -1;
  }
};

const cancelUserGame = async ({
  userId,
  gameId,
}: {
  userId: number;
  gameId: number;
}) => {
  const {rows: productRows} = await query(
    `SELECT product_code
     FROM user_product
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: gameRows} = await query(
    `SELECT game_type
     FROM user_solo_games
     WHERE id = $1`,
    [gameId],
  );

  const gameType = gameRows[0]?.game_type || "Self-Managed";

  const {rows: actionPointsRows} = await query(
    `SELECT amount, id
     FROM action_points
     WHERE title = 'Cancel Game'`,
    [],
  );
  const cancelGamePoints = actionPointsRows[0]?.amount || 0;

  await handleDeltaXp(userId, cancelGamePoints, "User Canceled Game", new Date(), gameId, actionPointsRows[1])

  await query(
    `INSERT Into dairy(user_id, created_date, title, entry, type, product, game_id)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      new Date(),
      "Game Canceled",
      `Canceled ${gameType} game using the cancel button and lost ${Math.abs(cancelGamePoints)}`,
      "c",
      productRows[0]["product_code"],
      gameId,
    ],
  );

  if (
    await query(
      "UPDATE user_solo_games SET game_status = 'completed', game_success = false, total_lock_up_time = 0 where user_id = $1 and id = $2",
      [userId, gameId],
    )
  ) {
    return 1;
  } else {
    return -1;
  }
};

const generateWheelInstance = async ({
  gameId,
  type,
  userId,
  size,
}: {
  gameId: number;
  type: number;
  userId: number;
  size: number;
}) => {
  const {rows: rows} = await query(
    `SELECT *
     FROM game_wheel_instance
     WHERE game_id = $1
       AND created_date >= NOW() - INTERVAL '24 hours'`,
    [gameId],
  );

  if (rows.length >= 1) {
    throw new Error("You already have a wheel instance in the last 24 hours.");
  }

  switch (type) {
    case 1:
      let {rows} = await query(
        `SELECT *
         FROM user_solo_games
         WHERE id = $1
         order by id desc
         limit 1`,
        [gameId],
      );

      let start_date = new Date(rows[0]["start_date"]);
      let original_end_date = new Date(rows[0]["original_end_date"]);

      let min = rows[0]["minimum_wheel_percentage"];
      let max = rows[0]["maximum_wheel_percentage"];

      let amounts = [];

      let diffInMilliSeconds =
        original_end_date.valueOf() - start_date.valueOf();

      for (let i = 0; i < size - 1; i++) {
        let percentage = min + Math.floor(Math.random() * (max - min));
        let finalValue = Math.floor(
          (diffInMilliSeconds / (1000 * 60)) * (percentage / 100),
        );

        amounts.push(finalValue);
      }

      if (size === 5) {
        await query(
          `INSERT Into game_wheel_instance(punishment_time1, punishment_time2, punishment_time3,
                                           reward_time1, game_id)
           values ($1, $2, $3, $4, $5)`,
          [...amounts, rows[0]["id"]],
        );
      } else if (size === 7) {
        await query(
          `INSERT Into game_wheel_instance(punishment_time1, punishment_time2, punishment_time3,
                                           punishment_time4,
                                           reward_time1, reward_time2, game_id)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [...amounts, rows[0]["id"]],
        );
      }

      break;
    case 2:
      // Query to get punishment IDs
      const punishmentQuery =
        "SELECT punishment_id FROM user_punishments WHERE user_id = $1 ORDER BY RANDOM() LIMIT $2";
      const punishmentResult = await query(punishmentQuery, [
        userId,
        size === 7 ? 4 : 3,
      ]);

      // Ensure we have exactly 3 punishments
      if (
        (punishmentResult.rows.length < 3 && size === 5) ||
        (punishmentResult.rows.length < 4 && size === 7)
      ) {
        throw new Error("Not enough punishments found for the user.");
      }

      // Query to get reward ID
      const rewardQuery =
        "SELECT reward_id FROM user_rewards WHERE user_id = $1 ORDER BY RANDOM() LIMIT $2";
      const rewardResult = await query(rewardQuery, [
        userId,
        size === 5 ? 1 : 2,
      ]);

      // Ensure we have at least one reward
      if (
        (rewardResult.rows.length < 1 && size === 5) ||
        (rewardResult.rows.length < 2 && size === 7)
      ) {
        throw new Error("No rewards found for the user.");
      }

      // Extract punishment and reward IDs
      const punishments = punishmentResult.rows.map((row) => row.punishment_id);
      const reward = rewardResult.rows.map((row) => row.reward_id);

      let insertQuery = "";

      if (size === 5) {
        insertQuery = `
            INSERT INTO game_wheel_instance (punishment1id, punishment2id, punishment3id, reward1id,
                                             game_id)
            VALUES ($1, $2, $3, $4, $5)
        `;
      } else if (size === 7) {
        insertQuery = `
            INSERT INTO game_wheel_instance (punishment1id, punishment2id, punishment3id, punishment4id,
                                             reward1id, reward2id,
                                             game_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
      }

      await query(insertQuery, [...punishments, ...reward, gameId]);
      break;
  }

  return 1;
};

const getWheelInstance = async ({gameId}: { gameId: string }) => {
  const {rows} = await query(
    `SELECT *,
            p1.name as punishment1_name,
            p2.name as punishment2_name,
            p3.name as punishment3_name,
            p4.name as punishment4_name,
            r1.name as reward1_name,
            r2.name as reward2_name
     FROM game_wheel_instance
              left join punishments p1 on punishment1id = p1.id
              left join punishments p2 on punishment2id = p2.id
              left join punishments p3 on punishment3id = p3.id
              left join punishments p4 on punishment4id = p4.id
              left join rewards r1 on reward1id = r1.id
              left join rewards r2 on reward2id = r2.id
     WHERE game_id = $1
       AND created_date >= NOW() - INTERVAL '24 hours'`,
    [gameId],
  );

  // If no game_wheel_instance is found, return an error
  if (rows.length === 0) {
    return -1;
  }

  // If a game_wheel_instance is found, return the data
  return rows[0];
};

function convertMinutesToDHM(minutes: number) {
  const days = Math.floor(minutes / (60 * 24));
  minutes -= days * 60 * 24;
  const hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  return `${days}D ${hours}H ${Math.floor(minutes)}M`;
}

const submitWheel = async ({
  gameId,
  itemName,
  type,
  accepted,
  userId,
}: {
  gameId: string;
  itemName: string;
  type: number;
  accepted: boolean;
  userId: number;
}) => {
  const {rows} = await query(
    `SELECT product_code
     FROM user_product
     WHERE user_id = $1`,
    [userId],
  );

  await query(
    `UPDATE game_wheel_instance
     SET status = 2
     WHERE game_id = $1`,
    [gameId],
  );

  // Get the points for the wheel spin activity
  const {rows: activityPoints} = await query(
    `SELECT amount, id
     FROM action_points
     WHERE title = 'Wheel Spin'`,
    [],
  );

  const wheelSpinPoints = activityPoints[0]?.amount || 0;
  const wheelSpinId = activityPoints[0]?.id || 0;

  const addDiaryEntry = async (title: string, entry: string) => {
    await query(
      "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [userId, new Date(), title, entry, "c", rows[0].id, gameId],
    );
  };

  if (accepted) {
    if (type === 1) {
      await query(
        `UPDATE user_solo_games
         SET end_date =
                 CASE
                     WHEN max_lock_minutes IS NOT NULL THEN
                         LEAST(
                                 now() + (max_lock_minutes * INTERVAL '1 minute'),
                                 end_date + ($2 * INTERVAL '1 minute')
                         )
                     ELSE
                         end_date + ($2 * INTERVAL '1 minute')
                     END
         WHERE id = $1`,
        [gameId, itemName],
      );

      await query(
        "INSERT INTO countdown_changes (game_id, delta) VALUES ($1, $2)",
        [gameId, itemName],
      );

      await handleDeltaXp(userId, wheelSpinPoints, "Wheel Spin", new Date(), parseInt(gameId), wheelSpinId);

      await addDiaryEntry(
        "Accepted wheel spin",
        `You have accepted your results from the wheel and changed the lock up time by ${convertMinutesToDHM(
          parseInt(itemName),
        )}. You earned ${wheelSpinPoints} XP!`,
      );
    } else if (type === 2) {
      await handleDeltaXp(userId, wheelSpinPoints, "Wheel Spin", new Date(), parseInt(gameId), wheelSpinId);

      await addDiaryEntry(
        "Accept wheel spin",
        `You have accepted your results from the wheel ${itemName}. You earned ${wheelSpinPoints} XP!`,
      );
    }
  } else {
    const rejectEntry =
      type === 1
        ? `You have rejected your results from the wheel by ${convertMinutesToDHM(
          parseInt(itemName),
        )}`
        : `You have rejected your results from the wheel ${itemName}`;

    await addDiaryEntry("Rejected wheel spin", rejectEntry);
  }

  return 1;
};

const userCheated = async ({
  gameId,
  userId,
}: {
  gameId: string;
  userId: number;
}) => {
  const {rows} = await query(
    `SELECT product_code
     FROM user_product
     WHERE user_id = $1`,
    [userId],
  );

  // Query to get punishment IDs
  const punishmentQuery =
    "SELECT punishment_id FROM user_punishments WHERE user_id = $1 ORDER BY RANDOM() LIMIT 5";
  const punishmentResult = await query(punishmentQuery, [userId]);

  // Ensure we have exactly 4 punishments
  if (punishmentResult.rows.length < 5) {
    throw new Error("Not enough punishments found for the user.");
  }

  const {rows: cheatingGame} = await query(
    `SELECT amount, id
     FROM action_points
     WHERE title = 'Cheating Game'`,
    [],
  )

  const {rows: game} = await query(
    `SELECT *
     FROM user_solo_games
     WHERE id = $1`,
    [userId],
  );

  await handleDeltaXp(userId, cheatingGame[0]["amount"], "User cheated Game", new Date(), parseInt(gameId), cheatingGame[0]["id"])

  await query(
    "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      userId,
      new Date(),
      "Cheated in game.",
      `You cheated ${game[0]["game_type"]} game and lost ${Math.abs(cheatingGame[0]["amount"])}.`,
      "c",
      rows[0].id,
      gameId,
    ],
  );

  const punishments = punishmentResult.rows.map((row) => row.punishment_id);

  await query(
    `INSERT INTO cheater_punishment
     (punishment1id, punishment2id, punishment3id, punishment4id, punishment5id,
      game_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [...punishments, gameId],
  );
};

const submitCheatingWheel = async ({
  gameId,
  cheaterWheelId,
  itemName,
  accepted,
  userId,
}: {
  gameId: string;
  cheaterWheelId: string;
  itemName: string;
  accepted: boolean;
  userId: number;
}) => {

  const {rows: game_type} = await query(`
      select game_type
      from user_solo_games
      where id = $1
  `, [gameId])

  const gameType = game_type[0]["game_type"]

  const {rows} = await query(
    `SELECT product_code
     FROM user_product
     WHERE user_id = $1`,
    [userId],
  );

  const result2 = await query(
    `UPDATE cheater_punishment
     SET state = 2
     WHERE id = $1
     returning is_game_ending
    `,
    [cheaterWheelId],
  );

  const {is_game_ending} = result2.rows[0];

  if (is_game_ending) {
    await query(
      `UPDATE user_solo_games
       SET game_status = 'completed'
       WHERE id = $1
         and user_id = $2`,
      [gameId, userId],
    );
  }

  accepted
    ? await query(
      "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        userId,
        new Date(),
        `Accept ${is_game_ending ? "Cheating" : "Late"}
         wheel spin`,
        `You ${is_game_ending ? "cheated" : "have been late to resume "} in your ${gameType} game and accepted your results from the wheel ${itemName}`,
        "c",
        rows[0].id,
        gameId,
      ],
    )
    : await query(
      "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        userId,
        new Date(),
        `Reject ${is_game_ending ? "cheating" : "Late"} wheel spin`,
        `You ${is_game_ending ? "cheated" : "late"} in your ${gameType} game and rejected your results from the wheel ${itemName}`,
        "c",
        rows[0].id,
        gameId,
      ],
    );

  return 1;
};

const submitGame = async ({
  gameId,
  userId,
  acceptedExtraTime,
}: {
  gameId: string;
  userId: number;
  acceptedExtraTime: boolean;
}) => {
  const {rows} = await query(
    `SELECT product_code
     FROM user_product
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: gameTypeRows} = await query(
    `SELECT game_type
     FROM user_solo_games
     WHERE id = $1`,
    [gameId],
  );

  const gameType = gameTypeRows[0].game_type;
  const isStopWatch = gameTypeRows[0].game_type === "Stop Watch";

  const {rows: updateRows} = await query(
    `UPDATE user_solo_games
     SET game_status        = 'completed',
         game_success       = true,
         end_date           = $3,
         original_end_date  = $3,
         total_lock_up_time = CASE
                                  WHEN $4 THEN EXTRACT(EPOCH FROM ($3 - start_date)) / 60
                                  ELSE (EXTRACT(EPOCH FROM (original_end_date - start_date)) / 60) +
                                       (CASE WHEN $5 THEN EXTRACT(EPOCH FROM ($3 - end_date)) / 60 ELSE 0 END)
             END
     WHERE id = $1
       and user_id = $2
     RETURNING total_lock_up_time`,
    [gameId, userId, new Date(), isStopWatch, acceptedExtraTime],
  );

  const {rows: userTrackRows} = await query(
    `SELECT *
     FROM tracker
     WHERE user_id = $1`,
    [userId],
  );

  if (userTrackRows.length === 0) {
    await query(
      `INSERT INTO tracker (user_id, running_total_lockup, total_games_played, last_locked_date, longest_lockup,
                            longest_lockup_period_end)
       VALUES ($1, $2, 1, NOW(), $2, NOW())`,
      [userId, updateRows[0].total_lock_up_time],
    );
  } else {
    const {rows: longestLockupRows} = await query(
      `SELECT longest_lockup
       FROM tracker
       WHERE user_id = $1`,
      [userId],
    );

    if (
      updateRows[0].total_lock_up_time > longestLockupRows[0].longest_lockup
    ) {
      await query(
        `UPDATE tracker
         SET longest_lockup            = $2,
             longest_lockup_period_end = NOW()
         WHERE user_id = $1`,
        [userId, updateRows[0].total_lock_up_time],
      );
    }

    await query(
      `UPDATE tracker
       SET running_total_lockup = running_total_lockup + $2,
           total_games_played   = total_games_played + 1,
           last_locked_date     = NOW()
       WHERE user_id = $1`,
      [userId, updateRows[0].total_lock_up_time],
    );
  }

  await query(
    "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      userId,
      new Date(),
      `${gameType} Game completed`,
      `Congratulations! Your ${gameType} game has ended in success.`,
      "c",
      rows[0].id,
      gameId,
    ],
  );

  await query(
    "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      userId,
      new Date(),
      "Total lock up time increased",
      `Congratulations! total lock up time increased by ${convertMinutesToDHM(updateRows[0].total_lock_up_time)}.`,
      "c",
      rows[0].id,
      gameId,
    ],
  );

  return 1;
};

const toggleDailySpin = async ({
  dailySpin,
  gameId,
  userId,
}: {
  dailySpin: boolean;
  gameId: string;
  userId: number;
}) => {
  await query(
    `UPDATE user_solo_games
     SET daily_spin = $3
     WHERE id = $1
       and user_id = $2`,
    [gameId, userId, dailySpin],
  );

  return 1;
};

const updateUserSettingsState = async (userId: number, state: number) => {
  await query(
    `UPDATE user_settings
     SET product_setup_status = $2
     WHERE user_id = $1`,
    [userId, state],
  );

  return 1;
};

const diaryMontly = async (userId: number) => {
  const {rows} = await query(
    `SELECT *
     FROM dairy
     WHERE user_id = $1`,
    [userId],
  );

  const diary = rows.map((row) => recursiveToCamel(row));

  return diary;
};

const getUserTracker = async (userId: number) => {
  let allData = {};

  const {rows} = await query(`SELECT *
                              FROM tracker
                              WHERE user_id = $1`, [
    userId,
  ]);

  allData = rows[0];

  const {rows: userLock} = await query(
    `SELECT *
     FROM user_lock_type
              left join lock_type on lock_type.id = user_lock_type.lock_type_id
     WHERE user_id = $1`,
    [userId],
  );

  allData = {...allData, userLock};

  const {rows: userDeviceType} = await query(
    `SELECT *
     FROM user_device_type
              left join device_type on device_type.id = user_device_type.device_type
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: userInGameCheck} = await query(
    `SELECT *
     FROM user_solo_games
     WHERE user_id = $1
       AND (game_status = 'In Game' or game_status = 'paused')`,
    [userId],
  );

  if (userInGameCheck.length > 0) {
    allData = {...allData, gameStatus: "In Game"};
  } else {
    allData = {...allData, gameStatus: "Not In Game"};
  }

  allData = {...allData, userDeviceType};

  return allData;
};

const getUserAchievements = async (userId: number): Promise<any[]> => {
  const {rows} = await query(
    `select achievements.*,
            user_achievement.date       as unlocked_date,
            user_solo_games.id          as game_id,
            user_solo_games.game_status as game_status,
            user_achievement.id         as user_achievement_id
     FROM achievements
              LEFT JOIN user_achievement
                        ON user_achievement.achievement_id = achievements.id and
                           user_achievement.game_id in (select id from user_solo_games where user_id = $1)
              LEFT JOIN user_solo_games
                        ON user_achievement.game_id = user_solo_games.id
                            AND user_solo_games.user_id = $1
     WHERE user_solo_games.user_id = $1
        OR user_solo_games.user_id IS NULL;`,
    [userId],
  );

  if (!rows.length) {
    return [];
  }

  return rows.map((row) => recursiveToCamel(row));
};

/**
 * Checks if a user has unlocked a specific achievement.
 *
 * Returns:
 * - -1: User is not eligible for the achievement but provides the percentage completed.
 * - 0: Achievement criteria type is user determined.
 * - 1: User is eligible for the achievement.
 * - 2: Achievement is already unlocked, along with the date of achievement and percentage of users who have completed it.
 *
 * @param {number} userId - The ID of the user.
 * @param {string} achievementId - The ID of the achievement.
 * @returns {Promise<{status: number, dateOfAchievement?: string, percentageCompleted?: number}>} - The status of the achievement check.
 */
const checkAchievement = async (
  userId: number,
  achievementId: string,
): Promise<{
  status: number;
  dateOfAchievement?: string;
  percentageCompleted?: number;
}> => {
  // Check if the achievement is already unlocked
  const {rows: existingAchievement} = await query(
    `SELECT *,
            (SELECT COUNT(*) FROM user_achievement WHERE achievement_id = $1) * 100.0 /
            (SELECT COUNT(*) FROM users) AS percentage_completed
     FROM user_achievement
     WHERE achievement_id = $1
       AND game_id IN (SELECT id FROM user_solo_games WHERE user_id = $2)`,
    [achievementId, userId],
  );

  if (existingAchievement.length > 0) {
    return {
      status: 2, // Achievement already unlocked
      dateOfAchievement: existingAchievement[0].date,
      percentageCompleted: existingAchievement[0].percentage_completed,
    };
  }

  const {rows: userAchievement} = await query(
    `SELECT *
     FROM achievements
     WHERE id = $1`,
    [achievementId],
  );

  const {rows: currentGame} = await query(
    `SELECT *
     FROM user_solo_games
     WHERE user_id = $1
       AND (game_status = 'In Game' or game_status = 'paused')`,
    [userId],
  );

  const {criteria} = userAchievement[0];
  const userGame = currentGame[0];

  if (!userGame) {
    return {status: -1};
  }

  if (criteria.type === "time") {
    const gameDurationMinutes =
      (new Date().getTime() - new Date(userGame.start_date).getTime()) /
      (1000 * 60);

    // Check if the game duration meets the criteria
    if (gameDurationMinutes >= criteria.minutes) {
      return {status: 1}; // Eligible for achievement
    } else {
      const percentageCompleted =
        (gameDurationMinutes / criteria.minutes) * 100;
      return {status: -1, percentageCompleted}; // Not eligible for achievement
    }
  } else {
    return {status: 0}; // User determined
  }
};

/**
 * Claims an achievement for a user if they are eligible.
 *
 * @param {number} userId - The ID of the user.
 * @param {string} achievementId - The ID of the achievement.
 * @returns {Promise<{status: number, message: string}>} - The status and message of the claim attempt.
 */
const claimAchievement = async (
  userId: number,
  achievementId: string,
): Promise<{ status: number; message: string }> => {
  const achievementCheck = await checkAchievement(userId, achievementId);

  if (achievementCheck.status === 1 || achievementCheck.status === 0) {
    // User is eligible for the achievement
    const {rows: currentGame} = await query(
      `SELECT id
       FROM user_solo_games
       WHERE user_id = $1
         AND (game_status = 'In Game' or game_status = 'paused')`,
      [userId],
    );

    const gameId = currentGame[0]?.id;

    const {rowCount, rows} = await query(
      `INSERT INTO user_achievement (achievement_id, date, game_id)
       VALUES ($1, NOW(), $2)`,
      [achievementId, gameId],
    );

    if (rowCount === 0) {
      return {
        status: -1,
        message: `Failed to claim achievement: ${JSON.stringify(rows)}`,
      };
    }

    // Get achievement details
    const {rows: achievementDetails} = await query(
      `SELECT name, points
       FROM achievements
       WHERE id = $1`,
      [achievementId],
    );
    const achievementName = achievementDetails[0].name;
    const achievementPoints = achievementDetails[0].points;

    // Add diary entry
    await query(
      `INSERT INTO dairy (user_id, created_date, title, entry, type)
       VALUES ($1, NOW(), $2, $3, 'c')`,
      [
        userId,
        "Achievement Unlocked",
        `You have achieved the "${achievementName}" achievement and earned ${achievementPoints} XP!`,
      ],
    );

    // Update user's XP
    await query(`UPDATE users
                 SET xp_points = xp_points + $1
                 WHERE id = $2`, [
      achievementPoints,
      userId,
    ]);

    // Record XP change
    await query(
      `INSERT INTO xp_change (user_id, amount, reason, date)
       VALUES ($1, $2, $3, NOW())`,
      [userId, achievementPoints, `Unlocked achievement: ${achievementName}`],
    );

    return {status: 1, message: "Achievement claimed successfully"};
  } else if (achievementCheck.status === 2) {
    return {status: 2, message: "Achievement already unlocked"};
  } else if (achievementCheck.status === -1) {
    return {
      status: -1,
      message: `Achievement not yet unlocked. ${achievementCheck.percentageCompleted}% completed.`,
    };
  } else {
    return {
      status: -1,
      message: "Achievement not yet unlocked.",
    };
  }
};

const getGameVerificationAttempt = async (
  gameId: number,
): Promise<{ id: number; code: string }> => {
  // Check if there's an unused attempt
  const {rows: unusedAttempt} = await query(
    `SELECT gva.id, gva.code
     FROM game_verification_attempt gva
              LEFT JOIN game_verification_image gvi ON gva.id = gvi.attempt_id
     WHERE gva.game_id = $1
       AND gvi.id IS NULL
     ORDER BY gva.date DESC
     LIMIT 1`,
    [gameId],
  );

  if (unusedAttempt.length > 0) {
    return unusedAttempt[0];
  }

  // If no unused attempt, create a new one
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit number
  const {rows: newAttempt} = await query(
    `INSERT INTO game_verification_attempt (code, game_id, date)
     VALUES ($1, $2, NOW())
     RETURNING id, code`,
    [code, gameId],
  );

  return newAttempt[0];
};

const uploadVerificationImage = async (
  gameId: number,
  attemptId: number,
  imageUrl: string,
): Promise<{ status: number; message: string }> => {
  try {
    const {rowCount} = await query(
      `INSERT INTO game_verification_image (game_id, attempt_id, image_url, date)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [gameId, attemptId, imageUrl],
    );

    if (rowCount === 0) {
      return {status: -1, message: "Failed to upload verification image"};
    }

    // Get userId from gameId
    const {rows: userIdRows} = await query(
      `SELECT user_id
       FROM user_solo_games
       WHERE id = $1`,
      [gameId],
    );
    const userId = userIdRows[0]?.user_id;

    if (!userId) {
      return {status: -1, message: "User not found for this game"};
    }

    // Get XP points for image verification
    const {rows: actionPointsRows} = await query(
      `SELECT amount
       FROM action_points
       WHERE title = 'Image Verification'`,
      [],
    );
    const verificationPoints = actionPointsRows[0]?.amount || 0;

    // Award XP to the user
    await query(`UPDATE users
                 SET xp_points = xp_points + $1
                 WHERE id = $2`, [
      verificationPoints,
      userId,
    ]);

    // Record XP change
    await query(
      `INSERT INTO xp_change (user_id, amount, reason, date, game_id)
       VALUES ($1, $2, $3, NOW(), $4)`,
      [userId, verificationPoints, "Image Verification", gameId],
    );

    // Add diary entry
    await query(
      `INSERT INTO dairy (user_id, created_date, title, entry, type, game_id)
       VALUES ($1, NOW(), $2, $3, 'c', $4)`,
      [
        userId,
        "Image Verification Completed",
        `You have successfully uploaded a verification image and earned ${verificationPoints} XP!`,
        gameId,
      ],
    );

    return {
      status: 1,
      message: `Verification image uploaded successfully. You earned ${verificationPoints} XP!`,
    };
  } catch (e) {
    console.error("Error uploading verification image", e);
    return {status: -1, message: "Error uploading verification image"};
  }
};

const getCommunityImagesForVerification = async (): Promise<Array<{ id: number; imageUrl: string; code: string }>> => {
  const {rows} = await query(
    `SELECT gvi.id, gvi.image_url, gva.code
     FROM game_verification_image gvi
              JOIN user_solo_games usg ON gvi.game_id = usg.id
              JOIN game_verification_attempt gva ON gvi.attempt_id = gva.id
     WHERE gvi.verified IS NULL
     ORDER BY RANDOM()`,
    [],
  );

  const images = rows.map((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    code: row.code,
  }));

  return images;
};

const verifyCommunityImage = async (
  imageId: number,
  isVerified: boolean,
): Promise<{ status: number; message: string }> => {
  try {
    const {rowCount} = await query(
      `UPDATE game_verification_image
       SET verified = $2
       WHERE id = $1`,
      [imageId, isVerified],
    );

    if (rowCount === 0) {
      return {status: -1, message: "Failed to verify community image"};
    }

    return {status: 1, message: "Community image verified successfully"};
  } catch (e) {
    console.error("Error verifying community image", e);
    return {status: -1, message: "Error verifying community image"};
  }
};

const updateUserTimeLimits = async (
  id: number,
  minTime: number,
  maxTime: number,
): Promise<boolean> => {
  const queryText = `UPDATE user_settings
                     SET min_time = $2,
                         max_time = $3
                     WHERE user_id = $1
                     RETURNING *`;

  await query(queryText, [id, minTime, maxTime]);

  return true;
};

const recordOrgasm = async (
  userId: number,
  typeId: number,
  location: string,
  byWhom: string,
  orgasmDate: Date,
  notes: string,
): Promise<{ status: number; message: string }> => {
  try {
    const {rowCount} = await query(
      `INSERT INTO user_orgasm (userid, type_id, location, by_whom, created_date, orgasm_date, notes)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6)
       RETURNING id`,
      [userId, typeId, location, byWhom, orgasmDate, notes],
    );

    if (rowCount === 0) {
      return {status: -1, message: "Failed to record orgasm"};
    }

    // Update the tracker
    await query(
      `UPDATE tracker
       SET total_orgasms = total_orgasms + 1
       WHERE user_id = $1`,
      [userId],
    );

    // Add a diary entry for the orgasm
    await query(
      `INSERT INTO dairy (user_id, created_date, title, entry, type, product)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        orgasmDate,
        "Orgasm Recorded",
        `Orgasm recorded on ${orgasmDate.toLocaleDateString()}. Location: ${location}, By: ${byWhom}`,
        "c",
        null,
      ],
    );

    return {status: 1, message: "Orgasm recorded successfully"};
  } catch (e) {
    console.error("Error recording orgasm", e);
    return {status: -1, message: "Error recording orgasm"};
  }
};

const getOrgasmTypes = async (
  search: string = "",
): Promise<Array<{ id: number; type: string }>> => {
  const queryText = `
      SELECT id, type
      FROM orgasm_type
      WHERE LOWER(type) LIKE LOWER($1)
  `;

  const {rows} = await query(queryText, [`%${search}%`]);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
  }));
};

const getDetailedAnalytics = async (userId: number) => {
  const {rows: userRows} = await query(`SELECT *
                                        FROM users
                                        WHERE id = $1`, [
    userId,
  ]);

  const {rows: trackerRows} = await query(
    `SELECT *
     FROM tracker
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: gamesRows} = await query(
    `SELECT *
     FROM user_solo_games
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: orgasmRows} = await query(
    `SELECT uo.*, ot.type as orgasm_type
     FROM user_orgasm uo
              JOIN orgasm_type ot ON uo.type_id = ot.id
     WHERE uo.userid = $1`,
    [userId],
  );

  const {rows: achievementRows} = await query(
    `SELECT *
     FROM user_achievement
     WHERE game_id IN (SELECT id FROM user_solo_games WHERE user_id = $1)`,
    [userId],
  );

  const {rows: lockedAchievementRows} = await query(
    `SELECT COUNT(*) as locked_achievements_count
     FROM achievements
     WHERE id NOT IN (SELECT achievement_id
                      FROM user_achievement
                      WHERE game_id IN (SELECT id FROM user_solo_games WHERE user_id = $1))`,
    [userId],
  );

  const {rows: userDeviceRows} = await query(
    `SELECT *
     FROM user_device_type
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: userLockRows} = await query(
    `SELECT *
     FROM user_lock_type
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: userRewardRows} = await query(
    `SELECT *
     FROM user_rewards
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: userPunishmentRows} = await query(
    `SELECT *
     FROM user_punishments
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: userToyRows} = await query(
    `SELECT *
     FROM user_toys
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: userProductRows} = await query(
    `SELECT *
     FROM user_product
     WHERE user_id = $1`,
    [userId],
  );

  const {rows: userSettingsRows} = await query(
    `SELECT *
     FROM user_settings
     WHERE user_id = $1`,
    [userId],
  );

  const orgasmTypes = orgasmRows.reduce((acc, orgasm) => {
    acc[orgasm.orgasm_type] = (acc[orgasm.orgasm_type] || 0) + 1;
    return acc;
  }, {});

  const orgasmFrequency = calculateOrgasmFrequency(orgasmRows);

  // Generate heat map data for the last year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const today = new Date();

  const heatMapData = await query(
    `
        WITH RECURSIVE
            date_range AS (SELECT $1::date AS date
                           UNION ALL
                           SELECT date + 1
                           FROM date_range
                           WHERE date < $2::date),
            game_dates AS (SELECT gs::date AS date
                           FROM user_solo_games,
                                generate_series((start_date + interval '1 day')::date,
                                                (end_date + interval '1 day')::date, '1 day'::interval) gs
                           WHERE user_id = $3
                             AND game_success = true
                             AND end_date >= $1
                             AND end_date < $2::date + 1)
        SELECT date_range.date as day, COUNT(game_dates.date) as count
        FROM date_range
                 LEFT JOIN game_dates ON date_range.date = game_dates.date
        GROUP BY day
        ORDER BY day
    `,
    [oneYearAgo, today, userId],
  );

  const dayCount = Math.ceil(
    (today.getTime() - oneYearAgo.getTime()) / (24 * 60 * 60 * 1000),
  );
  const heatMap = new Array(dayCount).fill(0).map((_, index) => {
    const currentDate = new Date(
      oneYearAgo.getTime() + index * 24 * 60 * 60 * 1000,
    );
    return {
      date: currentDate.toISOString().split("T")[0],
      value: 0,
    };
  });

  heatMapData.rows.forEach((row) => {
    const dayIndex = Math.floor(
      (new Date(row.day).getTime() - oneYearAgo.getTime()) /
      (1000 * 60 * 60 * 24),
    );
    if (dayIndex >= 0 && dayIndex < dayCount) {
      heatMap[dayIndex].value = row.count > 0 ? 1 : 0;
    }
  });

  // Generate orgasm heat map data for the last year
  const orgasmHeatMapData = await query(
    `SELECT date_trunc('day', orgasm_date + interval '1 day') as day, COUNT(*) as count
     FROM user_orgasm
     WHERE userid = $1
       AND orgasm_date >= $2
     GROUP BY day
     ORDER BY day`,
    [userId, oneYearAgo],
  );

  const orgasmHeatMap = new Array(dayCount).fill(0).map((_, index) => {
    const currentDate = new Date(
      oneYearAgo.getTime() + index * 24 * 60 * 60 * 1000,
    );
    return {
      date: currentDate.toISOString().split("T")[0],
      value: 0,
    };
  });

  orgasmHeatMapData.rows.forEach((row) => {
    const dayIndex = Math.floor(
      (new Date(row.day).getTime() - oneYearAgo.getTime()) /
      (1000 * 60 * 60 * 24),
    );
    if (dayIndex >= 0 && dayIndex < dayCount) {
      orgasmHeatMap[dayIndex].value = row.count > 0 ? 1 : 0;
    }
  });

  const analytics = {
    user: userRows[0],
    tracker: trackerRows[0],
    totalGames: gamesRows.length,
    completedGames: gamesRows.filter((game) => game.game_status === "completed")
      .length,
    failedGames: gamesRows.filter((game) => game.game_success === false).length,
    averageLockupTime:
      gamesRows.reduce((acc, game) => acc + game.total_lock_up_time, 0) /
      gamesRows.length,
    totalOrgasms: orgasmRows.length,
    orgasmTypes,
    orgasmFrequency,
    achievementsUnlocked: achievementRows.length,
    lockedAchievements: lockedAchievementRows[0].locked_achievements_count,
    lastLoginDate: userRows[0].last_login,
    accountCreationDate: userRows[0].account_create_date,
    devices: userDeviceRows,
    locks: userLockRows,
    rewards: userRewardRows,
    punishments: userPunishmentRows,
    toys: userToyRows,
    products: userProductRows,
    settings: userSettingsRows[0],
    heatMap,
    orgasmHeatMap,
  };

  return recursiveToCamel(analytics);
};

const calculateOrgasmFrequency = (
  orgasmRows: Array<{ orgasm_date: string }>,
): string => {
  if (orgasmRows.length === 0) return "No orgasms recorded";

  const sortedOrgasms = orgasmRows.sort(
    (a, b) =>
      new Date(a.orgasm_date).getTime() - new Date(b.orgasm_date).getTime(),
  );
  const firstOrgasmDate = new Date(sortedOrgasms[0].orgasm_date);
  const lastOrgasmDate = new Date(
    sortedOrgasms[sortedOrgasms.length - 1].orgasm_date,
  );
  const daysBetween =
    (lastOrgasmDate.getTime() - firstOrgasmDate.getTime()) /
    (1000 * 60 * 60 * 24);

  if (daysBetween === 0) return "Multiple orgasms in one day";

  const frequency = daysBetween / orgasmRows.length;

  if (frequency < 1) return `${Math.round(1 / frequency)} times per day`;
  if (frequency < 7) return `${Math.round(7 / frequency)} times per week`;
  if (frequency < 30) return `${Math.round(30 / frequency)} times per month`;
  return `${Math.round(365 / frequency)} times per year`;
};

const getUserRank = async (
  userId: number,
): Promise<{
  rank: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  rankImage: string;
}> => {
  const {rows: userRows} = await query(
    `SELECT users.xp_points,
            users.level_id,
            users.rank_id,
            ranks.name                   AS rank_name,
            ranks.image                  AS rank_image,
            current_level.name           AS current_level_name,
            current_level.requiredpoints AS current_level_points,
            next_level.name              AS next_level_name,
            next_level.requiredpoints    AS next_level_points
     FROM users
              JOIN ranks ON users.rank_id = ranks.id
              JOIN levels AS current_level ON users.level_id = current_level.id
              JOIN levels AS next_level ON current_level.order + 1 = next_level.order
     WHERE users.id = $1`,
    [userId],
  );

  if (userRows.length === 0) {
    throw new Error("User not found");
  }

  const user = userRows[0];

  return {
    rank: user.rank_name,
    level: userRows[0].current_level_name,
    currentXP: user.xp_points,
    nextLevelXP: user.next_level_points,
    rankImage: user.rank_image,
  };
};

const pauseGame = async (gameId: number, pauseId: number, userId: number) => {
  const {rows} = await query(`
      SELECT *
      FROM pause_game
      WHERE id = $1
  `, [pauseId])


  await query(`
      INSERT INTO user_pause_table
          (game_id, pause_id, start_date)
      VALUES ($1, $2, now())
  `, [gameId, pauseId])

  await query(
    `UPDATE user_solo_games
     SET game_status = 'paused'
     WHERE id = $1
    `, [gameId])

  await query(
    `INSERT INTO dairy (user_id, created_date, title, entry, type)
     VALUES ($1, NOW(), $2, $3, 'c')`,
    [
      userId,
      `Paused Game`,
      `Paused game for ${rows[0]["name"]}`,
    ],
  );

}

const resumeGame = async (gameId: number, userId: number) => {
  const result = await query(`
      UPDATE user_pause_table
      SET end_date = NOW()
      WHERE end_date IS NULL
        AND game_id = $1
      RETURNING pause_id, start_date
  `, [gameId]);

  if (result.rows.length === 0) {
    throw new Error('No paused game found');
  }

  const {pause_id, start_date} = result.rows[0];

  let {rows: pausedGame} = await query(
    `
        select *
        from pause_game
        where id = $1
    `, [pause_id]
  )

  await query(`
      UPDATE tracker
      SET total_pauses = total_pauses + 1
      WHERE user_id = $1
  `, [userId])

  const now = new Date();
  const pauseDuration = now.getTime() - new Date(start_date).getTime();
  const pauseDurationMinutes = Math.round(pauseDuration / (1000 * 60)); // Round to 1 decimal place

  let deltaPauseTimeIn5Min = (pausedGame[0]["time"] - pauseDurationMinutes) / 5;

  if ((deltaPauseTimeIn5Min * -1) > pausedGame[0]["max_time_before_cancel"]) {
    await query(`
        UPDATE user_solo_games
        SET game_status = 'completed'
        where id = $1
    `, [gameId])

    const {rows: actionPointsRows} = await query(
      `SELECT amount, id
       FROM action_points
       WHERE title = 'Cancel Game'`,
      [],
    );
    const cancelGamePoints = actionPointsRows[0]?.amount || 0;

    await handleDeltaXp(userId, cancelGamePoints, "User Canceled Game by not resuming for too long", new Date(), gameId, actionPointsRows[1])

    await query(
      `INSERT Into dairy(user_id, created_date, title, entry, type, game_id)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        new Date(),
        "Game Canceled Because you are too late on resuming",
        `Canceled game because you were late to resume and lost ${Math.abs(cancelGamePoints)}`,
        "c",
        gameId,
      ],
    );
  } else if (deltaPauseTimeIn5Min < 0) {
    // Query to get punishment IDs
    const punishmentQuery =
      "SELECT punishment_id FROM user_punishments WHERE user_id = $1 ORDER BY RANDOM() LIMIT 5";
    const punishmentResult = await query(punishmentQuery, [userId]);

    // Ensure we have exactly 4 punishments
    if (punishmentResult.rows.length < 5) {
      throw new Error("Not enough punishments found for the user.");
    }

    const punishments = punishmentResult.rows.map((row) => row.punishment_id);

    await query(
      `INSERT INTO cheater_punishment
       (punishment1id, punishment2id, punishment3id, punishment4id, punishment5id,
        game_id, is_game_ending)
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [...punishments, gameId],
    );

    await query(`
        UPDATE user_solo_games
        SET end_date    =
                CASE
                    WHEN max_lock_minutes IS NOT NULL THEN
                        LEAST(
                                now() + (max_lock_minutes * INTERVAL '1 minute'),
                                end_date + ($1 || ' minutes')::interval
                        )
                    ELSE
                        end_date + ($1 || ' minutes')::interval
                    END,
            game_status = 'In Game'
        where id = $2
    `, [(deltaPauseTimeIn5Min * 15) + pauseDurationMinutes, gameId])


    await handleDeltaXp(userId, (deltaPauseTimeIn5Min * 15), "Late game resume", new Date(), gameId)

    await query(
      `INSERT INTO dairy (user_id, created_date, title, entry, type)
       VALUES ($1, $4, $2, $3, 'c')`,
      [
        userId,
        `Resume Game late and punishment applied`,
        `Game resumed and user is punished has to roll punishment wheel and lock up time increased by ${convertMinutesToDHM(Math.abs(deltaPauseTimeIn5Min * 15))} and points reduced by ${Math.abs(deltaPauseTimeIn5Min * 15)}.`,
        new Date()
      ],
    );

  } else {
    await query(
      `UPDATE user_solo_games
       SET game_status = 'In Game'
       WHERE id = $1
      `, [gameId])

    await query(
      `INSERT INTO dairy (user_id, created_date, title, entry, type)
       VALUES ($1, NOW(), $2, $3, 'c')`,
      [
        userId,
        `Resume Game`,
        `Game resumed `,
      ],
    );
  }


}

const extendGame = async (gameId: number, minutes: number, userId: number) => {
  // Query the product code for the user
  const {rows} = await query(
    `SELECT product_code
     FROM user_product
     WHERE user_id = $1`,
    [userId],
  );

  // Query the max_lock_minutes and current end_date from the user_solo_games table
  const {rows: gameRows} = await query(
    `SELECT max_lock_minutes, end_date
     FROM user_solo_games
     WHERE id = $1`,
    [gameId],
  );

  const maxLockMinutes = gameRows[0]["max_lock_minutes"];
  const currentEndDate = new Date(gameRows[0]["end_date"]);

  // Calculate the new end date by adding the extension minutes
  let newEndDate = new Date();
  newEndDate.setMinutes(currentEndDate.getMinutes() + minutes);

  // Calculate the maximum allowed end date based on max_lock_minutes
  if (maxLockMinutes) {
    const maxEndDate = new Date();
    maxEndDate.setMinutes(currentEndDate.getMinutes() + maxLockMinutes);

    // Ensure the new end date does not exceed the max_end_date
    if (newEndDate > maxEndDate) {
      newEndDate = maxEndDate;
    }
  }

  // Update the end_date and original_end_date in the user_solo_games table
  await query(
    `UPDATE user_solo_games
     SET end_date          = $1,
         original_end_date = $1
     WHERE id = $2`,
    [newEndDate, gameId],
  );

  // Log the extension in the dairy table
  await query(
    `INSERT INTO dairy(user_id, created_date, title, entry, type, product, game_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      new Date(),
      "Game extended",
      `You have decided to extend the game using the wheel and got ${convertMinutesToDHM(minutes)} minutes.`,
      "c",
      rows[0]["product_code"],
      gameId,
    ],
  );

  return true;
};


async function getEvents() {
  const {rows} = await query("SELECT * FROM event order by event_code desc", [])

  for (let i = 0; i < rows.length; i++) {
    const {rows: registeredUsers} = await query("select * from user_event where event_code = $1", [rows[i]["event_code"]])
    rows[i]["registeredUsers"] = registeredUsers;

    const {rows: rules} = await query("select id, content from event_rule where event_code = $1", [rows[i]["event_code"]])
    rows[i]["rules"] = rules;

    const {rows: levels} = await query("select * from event_level where event_code = $1", [rows[i]["event_code"]])
    rows[i]["levels"] = levels;
  }

  return rows.map((x) => recursiveToCamel(x));
}

async function getMedals(userId: number) {
  const {rows} = await query(`SELECT distinct on (e.id) e.id,
                                                        e.name,
                                                        event_level.image_url,
                                                        event_level.name as level_name,
                                                        e.start_date
                              FROM user_event
                                       left join event e on user_event.event_code = e.event_code
                                       left join event_level on e.event_code = event_level.event_code
                              where user_id = $1`, [userId])

  return rows.map((x) => recursiveToCamel(x));
}


const isNextMonthEvent = (startDate: string) => {
  const eventDate = new Date(startDate);
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return nextMonth > eventDate && today < eventDate;
};

async function registerEvent(eventId: number, userId: number) {
  const {rows: event} = await query("select * from event WHERE id = $1", [eventId]);

  const {rows: userEvents} = await query("select * from user_event WHERE user_id = $1 and event_code = $2", [userId, event[0]?.event_code ?? -1]);

  if (isNextMonthEvent(event[0].start_date) && userEvents.length === 0) {
    await query("INSERT INTO user_event (event_code, user_id, created_date) VALUES ($1, $2, $3)", [event[0].event_code, userId, new Date()])

    await query(`
                INSERT INTO dairy (user_id, created_date, title, entry, type)
                VALUES ($1, $2, $3, $4, $5)`,
      [userId, new Date(), `Registered for ${event[0]["name"]}`, "", "c"])

  } else {
    return false
  }

  return true;
}

async function registerAdventure(adventureId: number, userId: number) {
  const {rows: adventure} = await query("select * from adventure WHERE id = $1", [adventureId]);

  const {rows: userAdventure} = await query("select * from user_adventure WHERE user_id = $1 AND status is null", [userId]);

  if (userAdventure.length === 0) {
    await query("INSERT INTO user_adventure (adventure_code, user_id, start_date) VALUES ($1, $2, $3)", [adventure[0].adventure_code, userId, new Date()])

    await query(`
                INSERT INTO dairy (user_id, created_date, title, entry, type)
                VALUES ($1, $2, $3, $4, $5)`,
      [userId, new Date(), `Registered for ${adventure[0]["adventure_name"]}`, "", "c"])

  } else {
    return false
  }

  return true;
}


function getCurrentOrFutureEventWithMembers(events: any[]) {
  let response = "";

  const currentDate = new Date();

  for (const event of events) {
    if (
      new Date(currentDate.getTime()) > new Date(new Date(event["startDate"]).getTime() - (1000 * 60 * 60 * 24 * 30))
      &&
      currentDate < event["endDate"]
    ) {
      response += event["name"] + " has " + event["registeredUsers"].length + " members playing, ";
    }
  }

  return response;
}

function getJoinUs(events: any[]) {
  let response = "Join us for ";

  const currentDate = new Date();

  let first = true;

  for (const event of events) {
    if (
      new Date(currentDate.getTime()) > new Date(new Date(event["startDate"]).getTime() - (1000 * 60 * 60 * 24 * 30))
      &&
      currentDate < event["startDate"]
    ) {
      if (first) {
        response += event["name"];
      } else {
        response += " and" + event["name"];
      }
    }
  }

  for (const event of events) {
    if (
      new Date(currentDate.getTime()) > new Date(new Date(event["startDate"]).getTime() - (1000 * 60 * 60 * 24 * 30))
      &&
      currentDate < event["startDate"]
    ) {
      response += " \n" + event.name + " is: " + convertMinutesToDHM((new Date(event["startDate"]).getTime() - currentDate.getTime()) / (1000 * 60)) + " away";
    }
  }

  if (response === "Join us for ") {
    return ""
  }

  return response;
}

async function getCommunityNews() {
  const events = await getEvents();

  let response = "";

  response += getCurrentOrFutureEventWithMembers(events);
  response += getJoinUs(events);

  if (response === "") {
    response = "No news currently";
  }

  return response;
}

async function populateSoloLeaderboard() {
  const currentDate = new Date();

  await query(`DELETE
               FROM solo_leader_board`, [])
  const {rows} = await query(`select users.id as userId, user_solo_games.start_date
                              from user_solo_games
                                       left join users on user_solo_games.user_id = users.id
                                       left join user_settings us on users.id = us.user_id
                              WHERE game_status != 'completed'
                                and us.community = true`, []);

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];

    await query(`
                INSERT INTO solo_leader_board (userid, total_time, create_date)
                values ($1, $2, $3)
      `,
      // @ts-ignore
      [row["userid"], Math.floor(new Date(currentDate.getTime() - new Date(row["start_date"]).getTime()).getTime() / (1000 * 60)), currentDate])
  }
}

async function getSoloLeaderBoard() {
  const currentDate = new Date();

  const {rows} = await query("SELECT solo_leader_board.total_time, users.country, users.first_name, solo_leader_board.create_date FROM solo_leader_board left join users on solo_leader_board.userid = users.id order by total_time desc", []);

  if (rows.length === 0 || currentDate.getTime() > new Date(rows[0]["create_date"]).getTime() + (1000 * 60 * 60 * 12)) {
    await populateSoloLeaderboard();

    return getSoloLeaderBoard()
  }

  return rows;
}

async function checkIfAdventureIsTimedOut(adventure: any, userRegistered: any) {
  const startDate = new Date();
  const endDate = new Date(new Date(userRegistered["start_date"]).getTime() + adventure["max_time"] * 1000 * 60);

  const diff = endDate.getTime() - startDate.getTime();

  if (diff < 0) {
    const currentDate = new Date()

    await query("UPDATE user_adventure SET status = 'Timed Out', end_date = $1 WHERE user_id = $2 and adventure_code = $3", [currentDate, userRegistered["user_id"], adventure["adventure_code"]]);

    await handleDeltaXp(userRegistered["user_id"], -adventure["remove_xp_points"], `Failed adventure ${adventure["adventure_name"]} because it's timed out`, currentDate, null)

    await query(`INSERT INTO dairy
                     (user_id, created_date, title, entry, type)
                 VALUES ($1, $2, $3, $4,
                         'c')`, [userRegistered["user_id"], currentDate, `Failed adventure`, `Failed adventure ${adventure["adventure_name"]} because it's timed out and lose ${adventure["remove_xp_points"]} XP`]);

    return true
  }
  return false;
}

async function getAdventures(userId: number) {
  const {rows} = await query("SELECT * FROM adventure order by adventure_code desc", [])

  for (let i = 0; i < rows.length; i++) {
    const {rows: registeredUsers} = await query("select * from user_adventure where adventure_code = $1", [rows[i]["adventure_code"]])
    rows[i]["registeredUsers"] = registeredUsers;

    const {rows: rules} = await query("select id, content from adventure_rule where adventure_code = $1", [rows[i]["adventure_code"]])
    rows[i]["rules"] = rules;


    const userRegistered = rows[i].registeredUsers.filter((registeredUser: any) => registeredUser.user_id === userId)[0]

    if (userRegistered && userRegistered["status"] === null) {
      if (await checkIfAdventureIsTimedOut(rows[i], userRegistered))
        return getAdventures(userId)
    }

  }

  return rows.map((x) => recursiveToCamel(x));
}

async function submitAdventure(userId: number, adventureId: number, image: string, success: boolean) {

  const {rows: adventureRows} = await query("SELECT * FROM adventure WHERE id = $1", [adventureId]);
  const adventure = adventureRows[0];

  const currentDate = new Date();

  if (success) {
    await query("UPDATE user_adventure SET status = 'pending verification', verification_status = 'pending verification', end_date = $1, verification_image = $3 WHERE adventure_code = $2", [currentDate, adventure["adventure_code"], image]);

    await query(`INSERT INTO dairy
                     (user_id, created_date, title, entry, type)
                 VALUES ($1, $2, $3, $4,
                         'c')`, [userId, currentDate, `Submitted adventure`, `Submitted adventure ${adventure["adventure_name"]} for verification`]);
  } else {

    await query("UPDATE user_adventure SET status = 'fail', end_date = $1 WHERE adventure_code = $2", [currentDate, adventure["adventure_code"],]);

    await handleDeltaXp(userId, -adventure["remove_xp_points"], `Failed adventure ${adventure["adventure_name"]}`, currentDate, null)

    await query(`INSERT INTO dairy
                     (user_id, created_date, title, entry, type)
                 VALUES ($1, $2, $3, $4,
                         'c')`, [userId, currentDate, `Failed adventure`, `Failed adventure ${adventure["adventure_name"]} and lose ${adventure["remove_xp_points"]} XP`]);
  }
}

async function getAdventureVerification() {
  const {rows} = await query("SELECT user_adventure.*, a.adventure_name, a.adventure_description FROM user_adventure left join adventure a on user_adventure.adventure_code = a.adventure_code where verification_status = 'pending verification'", [])

  return rows;
}

async function verifyAdventure(userAdventureId: number, accepted: boolean) {
  const {rows} = await query("SELECT user_adventure.*, a.xp_points, a.remove_xp_points FROM user_adventure left join adventure a on user_adventure.adventure_code = a.adventure_code WHERE user_adventure.id = $1", [userAdventureId]);

  const currentDate = new Date();

  if (accepted) {
    await query(`
        UPDATE user_adventure
        SET status              = $2,
            verification_status = $3
        WHERE id = $1`, [userAdventureId, "success", "verified"])

    await handleDeltaXp(rows[0]["user_id"], rows[0]["xp_points"], "Adventure verified", currentDate, null);

    await query(`INSERT INTO dairy (user_id, created_date, title, entry, type)
                 VALUES ($1, $2, $3, $4, 'c')`,
      [
        rows[0]["user_id"],
        currentDate,
        "Adventure verified",
        `Adventure verified by our admins with resulting in success and gaining ${rows[0]["xp_points"]} XP`
      ]);
  } else {
    await query(`
        UPDATE user_adventure
        SET status              = $2,
            verification_status = $3
        WHERE id = $1`, [userAdventureId, "fail", "verified"])

    await handleDeltaXp(rows[0]["user_id"], -rows[0]["remove_xp_points"], "Adventure verified failed", currentDate, null);

    await query(`INSERT INTO dairy (user_id, created_date, title, entry, type)
                 VALUES ($1, $2, $3, $4, 'c')`,
      [
        rows[0]["user_id"],
        currentDate,
        "Adventure verified failed",
        `Adventure verified failed by our admins with resulting in failure and losing ${rows[0]["xp_points"]} XP`
      ]
    );
  }

}

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
  getSettings,
  getUserDevices,
  getUserLocks,
  getUserRewards,
  getUserPunishments,
  getUserToys,
  getDiary,
  addDiary,
  updateDiary,
  deleteDiary,
  updateSettings1,
  updateSettings2,
  updateSettings3,
  updateSettings4,
  updateSettings5,
  updateSettings6,
  updateSettings7,
  updateSettings8,
  updateSettings9,
  updateSettings10,
  updateSettings11,
  updateUserProfile,
  updateProfilePicture,
  updateAvatarPicture,
  userChangePassword,
  updateSettings1v2,
  getUserTickets,
  addTicket,
  toggleStatus,
  userChangeEmail,
  getUserGames,
  addUserGame,
  cancelUserGame,
  generateWheelInstance,
  getWheelInstance,
  submitWheel,
  userCheated,
  submitCheatingWheel,
  submitGame,
  toggleDailySpin,
  updateUserSettingsState,
  diaryMontly,
  getUserTracker,
  getUserAchievements,
  checkAchievement,
  claimAchievement,
  getGameVerificationAttempt,
  uploadVerificationImage,
  getCommunityImagesForVerification,
  verifyCommunityImage,
  updateUserTimeLimits,
  recordOrgasm,
  getOrgasmTypes,
  getDetailedAnalytics,
  getUserRank,
  pauseGame,
  resumeGame,
  extendGame,
  getEvents,
  registerEvent,
  getMedals,
  getCommunityNews,
  getSoloLeaderBoard,
  getAdventures,
  registerAdventure,
  submitAdventure,
  getAdventureVerification,
  verifyAdventure
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
