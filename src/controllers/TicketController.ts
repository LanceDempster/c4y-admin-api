import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import {
  TicketSearch,
} from "../schemas/TicketSearch";
import TicketModel from "../models/TicketModel";
// import { RuleCreate } from "../schemas/RuleCreate";
// import NotFound from "../errors/NotFound";
// import { RuleUpdate } from "../schemas/RuleUpdate";
import { Ticket } from "../interfaces/Ticket";
// import { TicketStatusCreate } from "../schemas/TicketStatusCreate";
// import { TicketStatusUpdate } from "../schemas/TicketStatusUpdate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { name, description, page }: TicketStatusSearch = query;

    let [ticketStatuses, count] = await TicketStatusModel.search(
      { name, description },
      page,
    );

    if (count === -1) count = await TicketStatusModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        ticketStatuses.map((x: TicketStatus) => {
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

// export const create: RequestHandler = async (req, res, next) => {
//   try {
//     const ticketStatusData = req.body as TicketStatusCreate;

//     const ticketStatus: TicketStatus = {
//       id: 0,
//       name: ticketStatusData.name,
//       description: ticketStatusData.description,
//     };

//     const result = await TicketStatusModel.create(ticketStatus);

//     return res.status(200).send(
//       new Result(true, "Ticket Status created", {
//         ...result,
//       }),
//     );
//   } catch (e) {
//     next(e);
//   }
// };

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
