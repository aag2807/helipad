export type SendMailInput = {
  to: string[];
  subject: string;
  htmlBody: string;
};

export interface IMailer {
  sendMail(input: SendMailInput): Promise<void>;
}
