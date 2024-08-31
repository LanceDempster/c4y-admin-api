import { query } from "../db";
import { DeviceType } from "../interfaces/DeviceType";
import { LockType } from "../interfaces/LockType";
import { Punishment } from "../interfaces/Punishment";
import { Reward } from "../interfaces/Reward";
import { Toy } from "../interfaces/Toy";
import { User } from "../interfaces/User";
import { UserProductFull } from "../interfaces/UserProductFull";
import { DiaryType } from "../interfaces/DiaryType";
import { compare, hash } from "bcrypt";
import { isValidPassword } from "../utils/helperFunctions";
import { Ticket } from "../interfaces/Ticket";
import assert from "node:assert";
import BadRequest from "../errors/BadRequest";

export const create = async (user: User, productCode: number, next: any) => {
  try {
    const { rows: productCodeRows } = await query(
      "SELECT product_code FROM register_product_code WHERE code = $1 AND used = false",
      [productCode],
    );

    if (productCodeRows.length < 1) {
      return next(new BadRequest("Product code is invalid"));
    }

    // Check if the username already exists
    const { rows: existingUsername } = await query(
      "SELECT username FROM users WHERE username = $1",
      [user.username],
    );

    if (existingUsername.length > 0) {
      return next(new BadRequest("Username is already taken"));
    }

    // Check if the email already exists
    const { rows: existingEmail } = await query(
      "SELECT email FROM users WHERE email = $1",
      [user.email],
    );

    if (existingEmail.length > 0) {
      return next(new BadRequest("Email is already registered"));
    }

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
                gender) \
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *";

    const { rows: userRows } = await query(queryText, [
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

    const res: User = recursiveToCamel(insertedUser);

    return res;
  } catch (error) {
    console.log(error);
    // Handle unexpected errors
    return next(new BadRequest("An unexpected error occurred"));
  }
};

export const getById = async (id: number = 0) => {
  const { rows } = await query(
    "SELECT users.*, user_settings.user_url, user_settings.avatar_url FROM users left join user_settings on users.id = user_settings.user_id WHERE users.id=$1",
    [id],
  );

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
    `SELECT *, product.id as product_id, count(*) OVER () AS count
         FROM user_product
                  inner join product on user_product.product_code = product.product_code
         WHERE user_product.user_id = ($1)
         ORDER BY id ASC
         LIMIT 10
         OFFSET
            (($2 - 1) * 10)`,
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
    if (value === "") {
    } else if (!value) continue;
    if (key === "user" || key === "token") continue;

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
                     LIMIT 10 OFFSET (($${i} - 1) * 10)`;

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

const getSettings = async (id: string) => {
  const { rows } = await query(
    "SELECT * FROM user_settings WHERE user_id = $1",
    [id],
  );

  if (!rows[0]) return undefined;

  const userSettings = recursiveToCamel(rows[0]);

  return userSettings;
};

const ifNoUserSettingsCreate = async (userId: number) => {
  const { rows } = await query(
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
                           product_setup_status = 1
                       WHERE user_id = $1 RETURNING *`;

  const { rows } = await query(queryText, [
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
                       WHERE user_id = $1 RETURNING *`;

  const { rows } = await query(queryText, [
    id,
    community,
    gameMessages,
    marketingMessages,
    keyHolder,
    userStories,
  ]);

  return true;
};

const updateSettings2 = async ({ id }: { id: number }) => {
  const { rows } = await query(
    `SELECT product_code
         FROM user_product
         WHERE user_id = $1`,
    [id],
  );

  // Check if the user already has a diary entry
  const { rowCount } = await query(
    `SELECT 1
         FROM dairy
         WHERE user_id = $1`,
    [id],
  );

  if (rowCount === 0) {
    const { rows } = await query(
      `SELECT product_code
             FROM user_product
             where user_id = $1`,
      [id],
    );

    const queryText = `update user_settings
                           set product_setup_status = 2
                           where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 3
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 4
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 5
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 6
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 7
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 8,
                           min_time             = $3,
                           max_time             =
                               $2
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 9,
                           key_storage          = $2
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 10,
                           user_url             = $2
                       where user_id = $1 RETURNING *`;

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
                       set product_setup_status = 11,
                           avatar_url           = $2
                       where user_id = $1 RETURNING *`;

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
                       where user_id = $1 RETURNING *`;

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
                       where user_id = $1 RETURNING *`;

  await query(queryText, [id, fileLocation]);

  return true;
};

const getUserDevices = async (id: string) => {
  const { rows } = await query(
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
  const { rows } = await query(
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
  const { rows } = await query(
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
  const { rows } = await query(
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
  const { rows } = await query(
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
  const { rows } = await query(
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
  const { rows } = await query(
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
                       where id = $1 RETURNING *`;

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
  const { rows } = await query(
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
         where id = $1 RETURNING *`,
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
         where id = $1 RETURNING *`,
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
          AND id = $2 RETURNING *`;

  await query(queryText, [userId, ticketId]);

  return true;
};

const getUserGames = async ({ userId }: { userId: number }) => {
  const { rows } = await query(
    `SELECT user_solo_games.*,
            cheater_punishment.id as cheater_wheel_id,
            p1.name               as punishment1Name,
            p2.name               as punishment2Name,
            p3.name               as punishment3Name,
            p4.name               as punishment4Name,
            p5.name               as punishment5Name,
            gvs.regularity,
            gvs.punishment_time,
            (SELECT image_url
             FROM game_verification_image
             WHERE game_id = user_solo_games.id
             ORDER BY date DESC
             LIMIT 1) as latest_verification_image,
            (SELECT date
             FROM game_verification_image
             WHERE game_id = user_solo_games.id
             ORDER BY date DESC
             LIMIT 1) as latest_verification_time
     FROM user_solo_games
     LEFT JOIN cheater_punishment
               ON user_solo_games.id = cheater_punishment.game_id AND
                  cheater_punishment.state = 1
     LEFT JOIN punishments p1 ON punishment1id = p1.id
     LEFT JOIN punishments p2 ON punishment2id = p2.id
     LEFT JOIN punishments p3 ON punishment3id = p3.id
     LEFT JOIN punishments p4 ON punishment4id = p4.id
     LEFT JOIN punishments p5 ON punishment5id = p5.id
     LEFT JOIN game_verification_settings gvs ON user_solo_games.id = gvs.game_id
     WHERE user_id = $1
       AND game_status = 'In Game'`,
    [userId],
  );

  for (const game of rows) {
    if (game.regularity && game.punishment_time) {
      const startDate = new Date(game.start_date);
      const currentDate = new Date();
      const daysSinceStart = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const windows = Math.floor(daysSinceStart / game.regularity);

      let newPunishments = 0;
      let punishedWindows = [];

      for (let i = 0; i < windows; i++) {
        const windowStartDate = new Date(
          startDate.getTime() + i * game.regularity * 24 * 60 * 60 * 1000,
        );
        const windowEndDate = new Date(
          windowStartDate.getTime() + game.regularity * 24 * 60 * 60 * 1000,
        );

        const { rows: verificationRows } = await query(
          `SELECT * FROM game_verification_image
           WHERE game_id = $1 AND date >= $2 AND date < $3 AND (verified IS NULL OR verified = true)`,
          [game.id, windowStartDate, windowEndDate],
        );

        if (verificationRows.length === 0) {
          const { rows: punishmentRows } = await query(
            `SELECT * FROM game_verification_punishment
             WHERE game_id = $1 AND date > $2 AND date <= $3`,
            [game.id, windowStartDate, windowEndDate],
          );

          if (punishmentRows.length === 0) {
            await query(
              `INSERT INTO game_verification_punishment (game_id, date)
               VALUES ($1, $2)`,
              [game.id, windowEndDate],
            );

            await query(
              `INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                userId,
                windowEndDate,
                "Verification Punishment",
                `You missed a verification window and received a punishment of ${game.punishment_time} minutes added to your lock time.`,
                "c",
                rows[0]["product_code"],
                game.id,
              ],
            );

            await query(
              `INSERT INTO countdown_changes (game_id, delta)
               VALUES ($1, $2)`,
              [game.id, game.punishment_time],
            );

            await query(
              `UPDATE user_solo_games
               SET end_date = end_date + ($2 * INTERVAL '1 minute')
               WHERE id = $1
               RETURNING end_date`,
              [game.id, game.punishment_time],
            );

            newPunishments++;
            punishedWindows.push(i + 1);
            game.punishment_count = (game.punishment_count || 0) + 1;
          }
        }
      }

      // Update the end_date in the game object if punishments were applied
      if (newPunishments > 0) {
        const { rows: updatedGameRows } = await query(
          `SELECT end_date FROM user_solo_games WHERE id = $1`,
          [game.id],
        );
        game.end_date = updatedGameRows[0].end_date;

        game.new_punishments = newPunishments;
        game.punished_windows = punishedWindows;
      }
    }
  }

  return rows;
};

const addUserGame = async ({
  userId,
  seconds,
  minimumWheelPercentage,
  maximumWheelPercentage,
  imageVerificationInterval,
  imageVerificationPunishment,
  gameType,
  notes,
}: {
  userId: number;
  seconds: number | null | undefined;
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
    const { rows } = await query(
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
                                          minimum_wheel_percentage, maximum_wheel_percentage)
             VALUES ($1, $2, $3, now()::timestamp, now()::timestamp + ($4 * INTERVAL '1 minute'),
                     now()::timestamp + ($4 * INTERVAL '1 minute'),
                     $5, $6)
             RETURNING id`,
        [
          userId,
          "In Game",
          gameType,
          seconds / 60,
          minimumWheelPercentage,
          maximumWheelPercentage,
        ],
      );
    }

    // Get the inserted game id
    const gameId = result.rows[0].id;

    if (typeof imageVerificationInterval === "string") {
      imageVerificationInterval = parseInt(imageVerificationInterval, 10);
    }
    if (typeof imageVerificationPunishment === "string") {
      imageVerificationPunishment = parseInt(imageVerificationPunishment, 10);
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
  const { rows: productRows } = await query(
    `SELECT product_code
         FROM user_product
         WHERE user_id = $1`,
    [userId],
  );

  const { rows: gameRows } = await query(
    `SELECT game_type
         FROM user_solo_games
         WHERE id = $1`,
    [gameId],
  );

  const gameType = gameRows[0]?.game_type || "Self-Managed";

  await query(
    `INSERT Into dairy(user_id, created_date, title, entry, type, product, game_id)
         values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      new Date(),
      "Game Canceled",
      `Canceled ${gameType} game using the cancel button`,
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
  const { rows: rows } = await query(
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
      let { rows } = await query(
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

const getWheelInstance = async ({ gameId }: { gameId: string }) => {
  const { rows } = await query(
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
  return `${days}D ${hours}H ${minutes}M`;
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
  const { rows } = await query(
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

  switch (type) {
    case 1:
      {
        accepted &&
          (await query(
            `UPDATE user_solo_games
                 SET end_date = end_date + ($2 * INTERVAL '1 minute')
                 WHERE id = $1`,
            [gameId, itemName],
          ));
      }

      {
        accepted &&
          (await query(
            "INSERT INTO countdown_changes (game_id, delta) VALUES ($1, $2)",
            [gameId, itemName],
          ));
      }

      {
        accepted
          ? await query(
              "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [
                userId,
                new Date(),
                "Accepted wheel spin",
                `You have accepted your results from the wheel and changed the lock up time by ${convertMinutesToDHM(parseInt(itemName))}`,
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
                "Rejected wheel spin",
                `You have rejected your results from the wheel by ${convertMinutesToDHM(parseInt(itemName))}`,
                "c",
                rows[0].id,
                gameId,
              ],
            );
      }

      break;
    case 2:
      {
        accepted
          ? await query(
              "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [
                userId,
                new Date(),
                "Accept wheel spin",
                `You have accepted your results from the wheel ${itemName}`,
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
                "Reject wheel spin",
                `You have rejected your results from the wheel ${itemName}`,
                "c",
                rows[0].id,
                gameId,
              ],
            );
      }
      break;
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
  const { rows } = await query(
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

  await query(
    "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      userId,
      new Date(),
      "Cheated in countdown.",
      "You cheated in your self-managed Countdown game.",
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
  const { rows } = await query(
    `SELECT product_code
         FROM user_product
         WHERE user_id = $1`,
    [userId],
  );

  await query(
    `UPDATE cheater_punishment
         SET state = 2
         WHERE id = $1`,
    [cheaterWheelId],
  );

  await query(
    `UPDATE user_solo_games
         SET game_status = 'completed'
         WHERE id = $1
           and user_id = $2`,
    [gameId, userId],
  );

  accepted
    ? await query(
        "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          userId,
          new Date(),
          "Accept cheating wheel spin",
          `You cheated in your self-managed countdown game and accepted your results from the wheel ${itemName}`,
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
          "Reject cheating wheel spin",
          `You cheated in your self-managed countdown game and rejected your results from the wheel ${itemName}`,
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
  const { rows } = await query(
    `SELECT product_code
         FROM user_product
         WHERE user_id = $1`,
    [userId],
  );

  const { rows: gameTypeRows } = await query(
    `SELECT game_type
         FROM user_solo_games
         WHERE id = $1`,
    [gameId],
  );

  const gameType = gameTypeRows[0].game_type;
  const isStopWatch = gameTypeRows[0].game_type === "Stop Watch";

  const { rows: updateRows } = await query(
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
           and user_id = $2 RETURNING total_lock_up_time`,
    [gameId, userId, new Date(), isStopWatch, acceptedExtraTime],
  );

  const { rows: userTrackRows } = await query(
    `SELECT *
             FROM tracker
             WHERE user_id = $1`,
    [userId],
  );

  if (userTrackRows.length === 0) {
    await query(
      `INSERT INTO tracker (user_id, running_total_lockup, total_games_played, last_locked_date, longest_lockup, longest_lockup_period_end)
                   VALUES ($1, $2, 1, NOW(), $2, NOW())`,
      [userId, updateRows[0].total_lock_up_time],
    );
  } else {
    const { rows: longestLockupRows } = await query(
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
             SET longest_lockup = $2,
                 longest_lockup_period_end = NOW()
             WHERE user_id = $1`,
        [userId, updateRows[0].total_lock_up_time],
      );
    }

    await query(
      `UPDATE tracker
                 SET running_total_lockup = running_total_lockup + $2,
                     total_games_played = total_games_played + 1,
                     last_locked_date = NOW()
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
  const { rows } = await query(
    `SELECT *
                                FROM dairy
                                WHERE user_id = $1`,
    [userId],
  );

  return rows;
};

const getUserTracker = async (userId: number) => {
  let allData = {};

  const { rows } = await query(`SELECT * FROM tracker WHERE user_id = $1`, [
    userId,
  ]);

  allData = rows[0];

  const { rows: userLock } = await query(
    `SELECT * FROM user_lock_type
        left join lock_type on lock_type.id = user_lock_type.lock_type_id
        WHERE user_id = $1`,
    [userId],
  );

  allData = { ...allData, userLock };

  const { rows: userDeviceType } = await query(
    `SELECT * FROM user_device_type
        left join device_type on device_type.id = user_device_type.device_type
        WHERE user_id = $1`,
    [userId],
  );

  const { rows: userInGameCheck } = await query(
    `SELECT * FROM user_solo_games
        WHERE user_id = $1
        AND game_status = 'In Game'`,
    [userId],
  );

  if (userInGameCheck.length > 0) {
    allData = { ...allData, gameStatus: "In Game" };
  } else {
    allData = { ...allData, gameStatus: "Not In Game" };
  }

  allData = { ...allData, userDeviceType };

  return allData;
};

const getUserAchievements = async (userId: number) => {
  const { rows } = await query(
    `select achievements.*,
        user_achievement.date as unlocked_date,
        user_solo_games.id as game_id,
        user_solo_games.game_status as game_status,
        user_achievement.id as user_achievement_id
            FROM achievements
            LEFT JOIN user_achievement
                ON user_achievement.achievement_id = achievements.id and user_achievement.game_id in (select id from user_solo_games where user_id = $1)
            LEFT JOIN user_solo_games
                ON user_achievement.game_id = user_solo_games.id
                AND user_solo_games.user_id = $1
            WHERE user_solo_games.user_id = $1 OR user_solo_games.user_id IS NULL;`,
    [userId],
  );

  if (!rows.length) {
    return [];
  }

  const achievements = rows.map((row) => recursiveToCamel(row));

  return achievements;
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
  const { rows: existingAchievement } = await query(
    `SELECT *, (SELECT COUNT(*) FROM user_achievement WHERE achievement_id = $1) * 100.0 / (SELECT COUNT(*) FROM users) AS percentage_completed
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

  const { rows: userAchievement } = await query(
    `SELECT *
         FROM achievements
         WHERE id = $1`,
    [achievementId],
  );

  const { rows: currentGame } = await query(
    `SELECT *
         FROM user_solo_games
         WHERE user_id = $1
           AND game_status = 'In Game'`,
    [userId],
  );

  const { criteria } = userAchievement[0];
  const userGame = currentGame[0];

  if (!userGame) {
    return { status: -1 };
  }

  if (criteria.type === "time") {
    const gameDurationMinutes =
      (new Date().getTime() - new Date(userGame.start_date).getTime()) /
      (1000 * 60);

    // Check if the game duration meets the criteria
    if (gameDurationMinutes >= criteria.minutes) {
      return { status: 1 }; // Eligible for achievement
    } else {
      const percentageCompleted =
        (gameDurationMinutes / criteria.minutes) * 100;
      return { status: -1, percentageCompleted }; // Not eligible for achievement
    }
  } else {
    return { status: 0 }; // User determined
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
    const { rows: currentGame } = await query(
      `SELECT id FROM user_solo_games WHERE user_id = $1 AND game_status = 'In Game'`,
      [userId],
    );

    const gameId = currentGame[0]?.id;

    const { rowCount, rows } = await query(
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

    return { status: 1, message: "Achievement claimed successfully" };
  } else if (achievementCheck.status === 2) {
    return { status: 2, message: "Achievement already unlocked" };
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
  const { rows: unusedAttempt } = await query(
    `SELECT gva.id, gva.code
     FROM game_verification_attempt gva
     LEFT JOIN game_verification_image gvi ON gva.id = gvi.attempt_id
     WHERE gva.game_id = $1 AND gvi.id IS NULL
     ORDER BY gva.date DESC
     LIMIT 1`,
    [gameId],
  );

  if (unusedAttempt.length > 0) {
    return unusedAttempt[0];
  }

  // If no unused attempt, create a new one
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit number
  const { rows: newAttempt } = await query(
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
    const { rowCount } = await query(
      `INSERT INTO game_verification_image (game_id, attempt_id, image_url, date)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [gameId, attemptId, imageUrl],
    );

    if (rowCount === 0) {
      return { status: -1, message: "Failed to upload verification image" };
    }

    return { status: 1, message: "Verification image uploaded successfully" };
  } catch (e) {
    console.error("Error uploading verification image", e);
    return { status: -1, message: "Error uploading verification image" };
  }
};

const getCommunityImagesForVerification = async (
  userId: number,
  limit: number = 1,
): Promise<Array<{ id: number; imageUrl: string; code: string }>> => {
  const { rows } = await query(
    `SELECT gvi.id, gvi.image_url, gva.code
     FROM game_verification_image gvi
     JOIN user_solo_games usg ON gvi.game_id = usg.id
     JOIN game_verification_attempt gva ON gvi.attempt_id = gva.id
     WHERE usg.user_id != $1
       AND gvi.verified IS NULL
     ORDER BY RANDOM()
     LIMIT $2`,
    [userId, limit],
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
    const { rowCount } = await query(
      `UPDATE game_verification_image
       SET verified = $2
       WHERE id = $1`,
      [imageId, isVerified],
    );

    if (rowCount === 0) {
      return { status: -1, message: "Failed to verify community image" };
    }

    return { status: 1, message: "Community image verified successfully" };
  } catch (e) {
    console.error("Error verifying community image", e);
    return { status: -1, message: "Error verifying community image" };
  }
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
