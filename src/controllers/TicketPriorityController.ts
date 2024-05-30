import { RequestHandler } from "express";
import { Result } from "../dto/Result";
import { TicketPrioritySearch } from "../schemas/TicketPrioritySearch";
import TicketPriorityModel from "../models/TicketPriorityModel";
import { TicketPriority } from "../interfaces/TicketPriority";
import { TicketPriorityCreate } from "../schemas/TicketPriorityCreate";
import NotFound from "../errors/NotFound";
import { TicketPriorityUpdate } from "../schemas/TicketPriorityUpdate";

export const getAll: RequestHandler = async (req, res, next) => {
  try {
    let query = {};
    Object.assign(query, req.query);
    const { code, name, description, page }: TicketPrioritySearch = query;

    let [ticketPriorities, count] = await TicketPriorityModel.search(
      { code, name, description },
      page,
    );

    if (count === -1) count = await TicketPriorityModel.count();

    res.status(200).send(
      new Result(
        true,
        count + "",
        ticketPriorities.map((x: TicketPriority) => {
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
    const ticketPriorityData = req.body as TicketPriorityCreate;

    const ticketPriority: TicketPriority = {
      id: 0,
			code: ticketPriorityData.code,
      name: ticketPriorityData.name,
      description: ticketPriorityData.description,
    };

    const result = await TicketPriorityModel.create(ticketPriority);

    return res.status(200).send(
      new Result(true, "Ticket priority created", {
        ...result,
      }),
    );
  } catch (e) {
    next(e);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticketPriority = await TicketPriorityModel.getById(~~+id);

    if (!ticketPriority)
      return next(new NotFound("No ticket status with this ID"));

    const newTicketStatus = await TicketPriorityModel.updateById(
      ~~+id,
      req.body as TicketPriorityUpdate,
    );

    return res
      .status(200)
      .send(
        new Result(true, "Ticket priority updated successfully", newTicketStatus),
      );
  } catch (e) {
    next(e);
  }
};

export const deleteTicketPriority: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    const ticketPriority = await TicketPriorityModel.getById(~~+id);

    if (!ticketPriority) return next(new NotFound("No ticket priority with this ID"));

    await TicketPriorityModel.deleteById(ticketPriority.id);

    return res.status(200).send(new Result(true, `Ticket Priority with Id:${id} deleted`));
  } catch (e) {
    next(e);
  }
};
