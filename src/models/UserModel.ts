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

export const create = async (user: User) => {
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

    const {rows} = await query(queryText, [
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
        user.timeZone,
        user.gender,
    ]);

    const res: User = recursiveToCamel(rows[0]);
    return res;
};

export const getById = async (id: number = 0) => {
    const {rows} = await query("SELECT * FROM users WHERE id=$1", [id]);

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
    const {rows} = await query("SELECT * FROM users WHERE email = $1", [email]);

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
                           product_setup_status = 1
                       WHERE user_id = $1 RETURNING *`;

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
                       WHERE user_id = $1 RETURNING *`;

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
    const {rowCount} = await query(`SELECT 1
                                    FROM dairy
                                    WHERE user_id = $1`, [
        id,
    ]);

    if (rowCount === 0) {
        const {rows} = await query(
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
    if (await query(
        "INSERT INTO dairy (user_id, created_date, title, entry, type, product) VALUES ($1, $2, $3, $4, $5, $6)", [diary.userId, diary.createdDate, diary.title, diary.entry, diary.type, diary.productCode]
    )) {
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
    category: number
) => {
    if (await query(
        `INSERT INTO tickets (user_id, user_email, ticket_title, description, ticket_category_id, ticket_priority_id,
                              ticket_status)
         VALUES ($1, $2, $3, $4, $5,
                 (SELECT id FROM ticket_priority WHERE name = 'Medium'),
                 (SELECT id FROM ticket_status WHERE name = 'Open'));`,
        [userId, userEmail, title, description, category]
    )) {
        return 1;
    } else {
        return -1;
    }
};

const updateDiary = async (title: string, entry: string, diaryId: string, userId: string) => {
    if (await query(
        "UPDATE dairy SET title = $1, entry = $2 where id = $3 and user_id = $4", [title, entry, diaryId, userId]
    )) {
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
    firstName: string,
    lastName: string,
    gender: string,
    dateOfBirth: string,
    country: string,
    timezone: string,
}) => {
    const queryText = `update users
                       set first_name    = $2,
                           last_name     = $3,
                           gender        = $4,
                           date_of_birth = $5,
                           country       = $6,
                           timezone      = $7
                       where id = $1 RETURNING *`;

    await query(queryText, [id, firstName, lastName, gender, dateOfBirth, country, timezone]);

    return true;
};

const userChangePassword = async ({
                                      id,
                                      oldPassword,
                                      newPassword
                                  }: {
    id: number;
    oldPassword: string,
    newPassword: string
}) => {
    const {rows} = await query(`select password
                                from users
                                where id = $1`, [id])

    if (!await compare(oldPassword, rows[0]["password"])) {
        throw new Error("Wrong password");
    }

    let passwordValidity = isValidPassword(newPassword);

    if (!passwordValidity["isValid"]) {
        throw new Error(passwordValidity["message"]);
    }

    newPassword = await hash(newPassword, 10);

    let res = await query(`update users
                           set password = $2
                           where id = $1 RETURNING *`, [id, newPassword])

    return true
}

const userChangeEmail = async ({
                                   id,
                                   newEmail
                               }: {
    id: number;
    newEmail: string,
}) => {

    let res = await query(`update users
                           set email = $2
                           where id = $1 RETURNING *`, [id, newEmail])


    let res0 = await query(`INSERT INTO user_email_history (user_id, email)
                            VALUES ($1, $2)`, [id, newEmail])

    return true
}

const toggleStatus = async ({
                                userId,
                                ticketId
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
}

const getUserGames = async ({userId}: { userId: number }) => {
    const {rows} = await query(`select *
                                from user_solo_games
                                where user_id = $1
                                  and game_status = 'In Game'`, [userId])

    return rows;
}
const addUserGame = async ({userId, seconds, minimumWheelPercentage, maximumWheelPercentage}: {
    userId: number,
    seconds: number,
    minimumWheelPercentage: number,
    maximumWheelPercentage: number
}) => {
    try {
        assert(minimumWheelPercentage >= 10 && minimumWheelPercentage <= maximumWheelPercentage, "Minimum Wheel Percentage must be more than 10 and less than Max Wheel Percentage");
        assert(maximumWheelPercentage <= 50 && maximumWheelPercentage >= minimumWheelPercentage, "Max Wheel Percentage must be less than 50 and more than Min Wheel Percentage");
    } catch (e) {
        console.error('Rolling back transaction due to errors', e);
        return -1;
    }


    try {
        const {rows} = await query(
            `SELECT product_code
             FROM user_product
             WHERE user_id = $1`,
            [userId],
        );

        // Calculate the current timestamp and the timestamp after the given seconds
        const now = new Date();
        const endDate = new Date(now.getTime() + seconds * 1000);

        // Insert into the database and get the id
        const result = await query(
            `INSERT INTO user_solo_games (user_id, game_status, game_type, start_date, end_date, original_end_date,
                                          minimum_wheel_percentage, maximum_wheel_percentage)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [userId, 'In Game', 'Self Countdown', now, endDate, endDate, minimumWheelPercentage, maximumWheelPercentage]
        );

        const timeDifference = Math.ceil((endDate.getTime() - now.getTime()) / 60_000);

        // Get the inserted game id
        const gameId = result.rows[0].id;

        await query("INSERT INTO countdown_changes (game_id, delta) VALUES ($1, $2)", [gameId, timeDifference]);

        // Insert into dairy and use the game id
        await query(
            `INSERT Into dairy(user_id, created_date, title, entry, type, product, game_id)
             values ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, new Date(), "Game Started", "Started Self-Managed game using the self entered countdown", 'c', rows[0]['product_code'], gameId]
        );

        return 1;
    } catch (e) {
        console.error('Rolling back transaction due to errors', e);
        return -1;
    }
};

const cancelUserGame = async ({userId, gameId}: { userId: number, gameId: number }) => {
    const {rows} = await query(
        `SELECT product_code
         FROM user_product
         WHERE user_id = $1`,
        [userId],
    );

    await query(
        `INSERT Into dairy(user_id, created_date, title, entry, type, product, game_id)
         values ($1, $2, $3, $4, $5, $6, $7)`
        , [userId, new Date(), "Game Canceled", "Canceled Self-Managed game using the cancel button", 'c', rows[0]['product_code'], gameId]
    );

    if (await query(
        "UPDATE user_solo_games SET game_status = 'completed', game_success = false, total_lock_up_time = 0 where user_id = $1 and id = $2"
        , [userId, gameId])) {
        return 1;
    } else {
        return -1;
    }
};

const generateWheelInstance = async ({gameId, type}: { gameId: number, type: number }) => {
    const {rows} = await query(
        `SELECT *
         FROM game_wheel_instance
         WHERE game_id = $1
           AND created_date >= NOW() - INTERVAL '24 hours'`,
        [gameId]
    );

    if (rows.length >= 1) {
        throw new Error('You already have a wheel instance in the last 24 hours.');
    }

    switch (type) {
        case 1:
            const {rows} = await query(
                `SELECT *
                 FROM user_solo_games
                 WHERE id = $1
                 order by id desc
                 limit 1`,
                [gameId]
            );

            let start_date = new Date(rows[0]["start_date"]);
            let original_end_date = new Date(rows[0]["original_end_date"]);

            let min = rows[0]["minimum_wheel_percentage"];
            let max = rows[0]["maximum_wheel_percentage"];

            let amounts = [];

            let diffInMilliSeconds = original_end_date.valueOf() - start_date.valueOf();

            for (let i = 0; i < 5; i++) {
                let percentage = min + Math.floor(Math.random() * (max - min))
                let finalValue = Math.floor((diffInMilliSeconds / (1000 * 60)) * (percentage / 100))

                amounts.push(
                    finalValue
                )
            }


            await query(
                `INSERT Into game_wheel_instance(punishment_time1, punishment_time2, punishment_time3, punishment_time4,
                                                 reward_time, game_id)
                 values ($1, $2, $3, $4, $5, $6)`
                , [...amounts, rows[0]["id"]]
            );
            break
        case 2:

            break
    }

    return 1;
}


const getWheelInstance = async ({gameId}: { gameId: string }) => {
    const {rows} = await query(
        `SELECT *
         FROM game_wheel_instance
         WHERE game_id = $1
           AND created_date >= NOW() - INTERVAL '24 hours'`,
        [gameId]
    );

    // If no game_wheel_instance is found, return an error
    if (rows.length === 0) {
        throw new Error('No wheel instance found for the given gameId in the last 24 hours.');
    }

    // If a game_wheel_instance is found, return the data
    return rows[0];
}


function convertMinutesToDHM(minutes: number) {
    const days = Math.floor(minutes / (60 * 24));
    minutes -= days * 60 * 24;
    const hours = Math.floor(minutes / 60);
    minutes -= hours * 60;
    return `${days}D ${hours}H ${minutes}M`;
}

const submitWheel = async ({gameId, amount, type, accepted, userId}: {
    gameId: string,
    amount: string,
    type: number,
    accepted: boolean,
    userId: number
}) => {

    const {rows} = await query(
        `SELECT product_code
         FROM user_product
         WHERE user_id = $1`,
        [userId],
    );

    switch (type) {
        case 1:


            await query(
                `UPDATE game_wheel_instance
                 SET status = 2
                 WHERE game_id = $1`,
                [gameId]
            );

        {
            accepted &&
            await query(
                `UPDATE user_solo_games
                 SET end_date = end_date + ($2 * INTERVAL '1 minute')
                 WHERE id = $1`,
                [gameId, amount]
            );
        }

        {
            accepted &&
            await query(
                "INSERT INTO countdown_changes (game_id, delta) VALUES ($1, $2)",
                [gameId, amount]
            );
        }

        {
            accepted ?
                await query(
                    "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [userId, new Date(), 'Accept wheel spin', `You have accepted your results from the wheel and changed the lock up time by ${convertMinutesToDHM(parseInt(amount))}`, 'c', rows[0].id, gameId]
                )
                :
                await query(
                    "INSERT INTO dairy (user_id, created_date, title, entry, type, product, game_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [userId, new Date(), 'Reject wheel spin', `You have rejected your results from the wheel by ${convertMinutesToDHM(parseInt(amount))}`, 'c', rows[0].id, gameId]
                )
        }


            break;
        case 2:

            break
    }

    return 1;
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
    submitWheel
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
