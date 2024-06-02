import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import { TicketSearch } from "../schemas/TicketSearch";
import TicketModel from "../models/TicketModel";
// import { RuleCreate } from "../schemas/RuleCreate";
// import NotFound from "../errors/NotFound";
// import { RuleUpdate } from "../schemas/RuleUpdate";
import { Ticket } from "../interfaces/Ticket";
import UserModel from "../models/UserModel";
import { TicketCreate } from "../schemas/TicketCreate";
// import { TicketStatusCreate } from "../schemas/TicketStatusCreate";
// import { TicketStatusUpdate } from "../schemas/TicketStatusUpdate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const {
      userId,
      userEmail,
      title,
      description,
      categoryId,
      statusId,
      priorityId,
      page,
    }: TicketSearch = query;

    let [tickets, count] = await TicketModel.search(
      {
        userId,
        userEmail,
        title,
        description,
        categoryId,
        statusId,
        priorityId,
      },
      page,
    );

    if (count === -1) count = await TicketModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        tickets.map((x: Ticket) => {
          return {
            ...x,
          };
        }),
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const ticketData = req.body as TicketCreate;

    const ticket: Ticket = {
      id: 0,
      userId: ticketData.userId,
      staffId: ticketData.staffId,
      staffName: ticketData.staffName,
      userEmail: ticketData.userEmail,
      title: ticketData.title,
      description: ticketData.description,
      categoryId: ticketData.categoryId,
      priorityId: ticketData.priorityId,
      statusId: ticketData.statusId,
    };

    const result = await TicketModel.create(ticket);

    return res.status(200).send(
      new Result(true, "Ticket created", {
        ...result,
      }),
    );
  } catch (e) {
    next(e);
  }
};

// export const update: RequestHandler = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const ticketStatus = await TicketStatusModel.getById(~~+id);

//     if (!ticketStatus)
//       return next(new NotFound("No ticket status with this ID"));

//     const newTicketStatus = await TicketStatusModel.updateById(
//       ~~+id,
//       req.body as TicketStatusUpdate,
//     );

//     return res
//       .status(200)
//       .send(
//         new Result(true, "Ticket Status updated successfully", newTicketStatus),
//       );
//   } catch (e) {
//     next(e);
//   }
// };

// export const deleteTicketStatus: RequestHandler<{ id: string }> = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     const { id } = req.params;

//     const ticketStatus = await TicketStatusModel.getById(~~+id);

//     if (!ticketStatus) return next(new NotFound("No ticket status with this ID"));

//     await TicketStatusModel.deleteById(ticketStatus.id);

//     return res.status(200).send(new Result(true, `Ticket status with Id:${id} deleted`));
//   } catch (e) {
//     next(e);
//   }
// };
