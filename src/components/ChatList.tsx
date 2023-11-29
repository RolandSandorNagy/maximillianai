import getChats from "~/pages/api/get-chats";
import { PrismaClient } from '@prisma/client'

const MAIN_URL = 'http://localhost:3000';
const FETCH_SETITNGS = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({})
};
  
type ChatElement = {
    title: string;    
    chatId: string;
};

type Props = {
    children: {
        chats: Array<ChatElement>;    
        changeChat: any;
        editChatTitle: any;
        deleteChat: any;
    }
};

/*
const selectChat = async function (event: any) {
    let target = event.target;
    while(target && target.tagName.toLowerCase() != 'li') {
        target = target.parentNode;
    }
    const chat_id = target.dataset.chatId; 
    const messages = await getChat(chat_id);
    //changeChat(messages);
}

const getChat = async function (chat_id: string) {
    FETCH_SETITNGS.body = JSON.stringify({chatId: chat_id});
    const response = await fetch(MAIN_URL + '/api/get-messages', FETCH_SETITNGS);
    const data = await response.json();
    const messages = data && data.data ? data.data : [];
    return messages;
};
*/

export const ChatList = (props: Props) => (
    <ul className="list-of-chats" {...props}>
        {props.children.chats?.map((chat, index) => {
            return (
                <li key={index} data-chat-id={chat?.id} onClick={props.children.changeChat}>
                    <svg className="basic-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20V14" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <p><span>{chat?.title}</span></p>
                    <input type="text" data-index={index} value={chat?.title} onChange={props.children.editChatTitle}></input>
                    <svg className="edit-chat" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.1666 10.6111L13.3888 7.83333M5.40272 18.5972L7.75297 18.3361C8.04012 18.3042 8.18369 18.2882 8.31789 18.2448C8.43695 18.2062 8.55025 18.1518 8.65472 18.0829C8.77248 18.0052 8.87462 17.9031 9.07892 17.6988L18.25 8.52777C19.017 7.76071 19.017 6.51705 18.25 5.74999C17.4829 4.98293 16.2392 4.98293 15.4722 5.74999L6.30114 14.921C6.09685 15.1253 5.9947 15.2275 5.91705 15.3452C5.84816 15.4497 5.7937 15.563 5.75516 15.682C5.71171 15.8162 5.69576 15.9598 5.66386 16.247L5.40272 18.5972Z" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <svg className="delete-chat" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.91667 5.75H14.0833M5.75 7.83334H18.25M16.8611 7.83334L16.3741 15.1384C16.301 16.2344 16.2645 16.7824 16.0278 17.1979C15.8194 17.5637 15.505 17.8578 15.1262 18.0414C14.6958 18.25 14.1466 18.25 13.0482 18.25H10.9518C9.85341 18.25 9.30419 18.25 8.87385 18.0414C8.49497 17.8578 8.18062 17.5637 7.97221 17.1979C7.73549 16.7824 7.69896 16.2344 7.62589 15.1384L7.13889 7.83334M10.6111 10.9583V14.4306M13.3889 10.9583V14.4306" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </li>                  
            );
        })}
    </ul>
);
  