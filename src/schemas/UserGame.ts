export default interface UserGame {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  game_status: string;
  product_code: string;
  punishment_count: number;
  cheater_wheel_id: number | null;
  punishment1Name: string | null;
  punishment2Name: string | null;
  punishment3Name: string | null;
  punishment4Name: string | null;
  punishment5Name: string | null;
  regularity: number | null;
  punishment_time: number | null;
  latest_verification_image: string | null;
  latest_verification_time: string | null;
  last_xp_award_date: string | null;
  last_verification_event_date: string | null;
  xpAwarded?: number;
  daysAwarded?: number;
  new_punishments?: number;
  punished_windows?: number[];
}
