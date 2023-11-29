import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Inter } from 'next/font/google';
import { Input } from '../components/Input';
import { ChatList } from '../components/ChatList';
import { InputButton } from '../components/InputButton';
import { Output } from '../components/Output';
import { Sources } from '../components/Sources';
import { useConversation } from '../hooks/useConversation';
import { useStream } from '../hooks/useStream';
import { aiName, aiTitle, suggestions } from '../../config';
import type { FormEventHandler, ChangeEventHandler } from 'react';
import { PrismaClient } from '@prisma/client'
import { MissingStaticPage } from 'next/dist/shared/lib/utils';
import { uuid } from 'uuidv4';


const inter = Inter({ weight: '300', subsets: ['latin'] });
const MAIN_URL = 'http://localhost:3000';
const FETCH_SETITNGS = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({})
};

const prisma = new PrismaClient();

export async function getServerSideProps() {
  const chats = await prisma.Chats.findMany();
  var _chats = chats.map(item => ({id: item.id, title: item.title}));
  return {
    props: {
      _chats: _chats,
      _messageHistory: []
    }
  }
}

const getChat = async function (chat_id: number) {
  FETCH_SETITNGS.body = JSON.stringify({chatId: chat_id});
  const response = await fetch(MAIN_URL + '/api/get-messages', FETCH_SETITNGS);
  const data = await response.json();
  const messages = data && data.data ? data.data : [];
  return messages;
};

const getLastId = async function (table: string) {
  let retVal = null;
  try {
    FETCH_SETITNGS.body = JSON.stringify({table: table});
    const response = await fetch(MAIN_URL + '/api/get-last-id', FETCH_SETITNGS);

    let res = await response.json();
    if (response.status !== 200) {
      throw res.error || new Error(`Request failed with status ${response.status}`);
    }
    retVal = res.data;

  } catch(error) {
    // TODO: Consider implementing your own error handling logic here
    console.error(error);
  }
  return retVal;
}

const saveRecord = async function (data: object, endpoint: string, table: string) {
  try {
    FETCH_SETITNGS.body = JSON.stringify({data: data, table: table});
    const response = await fetch(MAIN_URL + endpoint, FETCH_SETITNGS);

    let res = await response.json();
    if (response.status !== 200) {
      throw res.error || new Error(`Request failed with status ${response.status}`);
    }

  } catch(error) {
    // TODO: Consider implementing your own error handling logic here
    console.error(error);
  }

  let id = null;
  try {
    id = await getLastId(table);
  } catch(error) {
    // TODO: Consider implementing your own error handling logic here
    console.error(error);
  }

  return id;
}
const getRecords = async function (table: string, endpoint: string, callback: any) {
  let retVal = [];
  try {
    FETCH_SETITNGS.body = JSON.stringify({});
    const response = await fetch(MAIN_URL + endpoint, FETCH_SETITNGS);

    let res = await response.json();
    if (response.status !== 200) {
      throw res.error || new Error(`Request failed with status ${response.status}`);
    }
    retVal = res.data;

    if(typeof callback == 'function') {
      callback(retVal);
    }

  } catch(error) {
    // TODO: Consider implementing your own error handling logic here
    console.error(error);
  }
  return retVal;
}

const execCommand = async function () {
  const req = await fetch("http://localhost:3000/api/execute");
  const data = await req.json();
  console.log(data);
}

const fetchData = async () => {
  const response = await fetch('/api/storeJSONData')
  const data = await response.json();
  console.log(data);
}

export default function Main({ _chats, _messageHistory }) {
  const [inputValueK1, setInputValueK1] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [chatId, setChatId] = useState(0);
  const [chats, setChats] = useState(_chats);
  const [messageHistory, setMessageHistory] = useState(_messageHistory);
  const [interactions, setInteractions] = useState(Array<object>);
  const [showHelperDivUser, setShowHelperDivUser] = useState(false);
  const [showHelperDivMaxi, setShowHelperDivMaxi] = useState(false);
  const [showHelperDivUserQuestionnaire, setShowHelperDivUserQuestionnaire] = useState(false);
  const [showHelperDivMaxiQuestionnaire, setShowHelperDivMaxiQuestionnaire] = useState(false);
  const [startStream, isStreaming, outputStream, metadata] = useStream();
  const [startStreamQuestionnaire, isStreamingQuestionnaire, questionnaireOutputStream, questionnaireMetadata] = useStream();
  


  const [conversation, dispatchConversation] = useConversation();
  const [questionnaire, dispatchQuestionnaire] = useConversation();
  const scrollableElement = useRef<HTMLDivElement>(null);
  const questionnaireScrollableElement = useRef<HTMLDivElement>(null);
  const questionarieButtonSpan = useRef<HTMLButtonElement>(null);
  const mainWrapper = useRef<HTMLDivElement>(null);
  const mainHeading = useRef<HTMLDivElement>(null);
  
  const [isSuggestionsVisible, setSuggestionsVisible] = useState(false);
  const [isSuggestionsVisibleQuestionanaire, setSuggestionsVisibleQuestionnaire] = useState(false);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    if (event) event.preventDefault();
    if(mainHeading.current) {
      mainHeading.current.style.display = "none";
    }
    const input_value = inputValue;
    setInputValueK1(inputValue);
    if (inputValue.trim().length > 0) dispatchConversation({ type: 'setInput', value: inputValue });

    if(chatId == 0) {
      //setChatId(chat_id);
      let new_chat_title = getNewChatTitle(input_value);
      const chat_id = await saveNewChat({title: new_chat_title});
      setChatId(chat_id);
      const new_chat = {id: chat_id, title: new_chat_title};
      chats.push(new_chat);
      setChats(chats);
    }
  };

  const getNewChatTitle = function (input_value: string) {
    return input_value.substr(0, 100);
  }

  const newChat = function (event: any) {
    removeAllActive();
    setChatId(0);
    dispatchConversation({ type: 'update', value: [], metadata });        
  }

  const removeAllActive = function () {
    let lis = document.querySelectorAll('.list-of-chats li');
    for(let i = 0; i < lis.length; ++i) {
      lis[i].classList.remove('active');
    }
  }

  const changeChat = async function (event: any) {
    let target = event.target;
    if(target.className.baseVal == 'edit-chat') {
      let li = target;
      while(li && li.tagName.toLowerCase() != 'li') {
        li = li.parentNode;
      }
      if(li.classList.contains('editing')) {
        li.classList.remove('editing');
        // todo
      } else {
        li.classList.add('editing');
      }
      // todo: find input tag and focus on it
      let input = null;
      for(let i = 0; i < li.children.length && input == null; ++i) {
        const child = li.children[i];
        if(child.tagName.toLowerCase() == 'input') {
          input = child;
          break;
        }
      }
      if(input != null) {
        input.focus();
      }
      return;
    } else if(target.className.baseVal == 'delete-chat') {
      console.log('delete chat!');
      if(confirm('Are you sure you want to delete this chat?')) {
        // todo: delete chat
      }
      return;
    }
    
    if(target.tagName.toLowerCase() == 'input') { return; }
    while(target && target.tagName.toLowerCase() != 'li') {
        target = target.parentNode;
        if(target.tagName.toLowerCase() == 'input') { return; }
    }
    let ul = target.parentNode;
    for(let i = 0; i < ul.children.length; ++i) {
      ul.children[i].classList.remove('active');
    }
    target.classList.add('active');
    const chat_id = parseInt(target.dataset.chatId); 
    const messages = await getChat(chat_id);
    setChatId(chat_id);
    dispatchConversation({ type: 'update', value: messages, metadata });    
  }

  //const editChatTitle = async (chat_id: number, new_title: string) => {
  const editChatTitle = async (event: any) => {
    // TODO
    const index = parseInt(event.target.dataset.index);    
    let new_value = event.target.value;
    console.log('new_value');
    console.log(new_value);
    const chts = [];
    for(let i = 0; i < chats.length; ++i) {
      if(i == index) {
        const chat = {id: chats[i].id, title: new_value};
        chts.push(chat);
      } else {
        const chat = {id: chats[i].id, title: chats[i].title};
        chts.push(chat);
      }
    }
    setChats(chts);





    /*
    console.log('event');
    console.log(event);
    console.log('index');
    console.log(index);
    console.log('chats');
    console.log(chats);
    console.log('chats[index]');
    console.log(chats[index]);
    console.log('editChatTitle');
    */
  }

  const deleteChat = async (chat_id: number) => {
    // TODO
  }

  const generateChatId = () => {
    return uuid();
  };

  const onChange: ChangeEventHandler<HTMLInputElement> = event =>
    event.target instanceof HTMLInputElement && setInputValue(event.target.value);

  const onQuestionarieOpen: ClickEventHandler<HTMLButtonElement> = event => {
    if (mainWrapper.current) {
      if(mainWrapper.current.classList.contains("questionarie-open")) {
        let classes = [];
        for(let i = 0; i < mainWrapper.current.classList.length; ++i) {
          if(mainWrapper.current.classList[i] != "questionarie-open") {
            classes.push(mainWrapper.current.classList[i]);
          }
        }
        mainWrapper.current.classList = classes;
        if (questionarieButtonSpan.current) {
          questionarieButtonSpan.current.innerHTML = 'Show Questionnaires';
        }
      } else {
        mainWrapper.current.classList.add("questionarie-open");
        if (questionarieButtonSpan.current) {
          questionarieButtonSpan.current.innerHTML = 'Hide Questionnaires';
        }      
      }      
    }
  }

  /*
  const toggleSuggestions = () => setSuggestionsVisible(!isSuggestionsVisible);
  const toggleSuggestionsQuestionnaire = () => setSuggestionsVisibleQuestionnaire(!isSuggestionsVisibleQuestionanaire);
  */

  const addInteraction = function (interaction: object) {
    messageHistory.push(interaction);
    setMessageHistory(messageHistory);  
  }

  const updateFrontEndHelperDivs = function (user: boolean, maxi: boolean) {
    setShowHelperDivUser(user);
    setShowHelperDivMaxi(maxi);  
  }

  /*
  const updateFrontEndHelperDivsQuestionnaire = function (user: boolean, maxi: boolean) {
    setShowHelperDivUserQuestionnaire(user);
    setShowHelperDivMaxiQuestionnaire(maxi);  
  }
  */

  const saveNewMessagePair = async function () {
    const interaction = {input: conversation.input, output: outputStream, metadata: ''};
    addInteraction(interaction);
    if(chatId) {
      await saveRecord({...interaction, chatId: chatId}, '/api/save-record', 'Messages');      
    } else {
      await saveRecord(interaction, '/api/save-record', 'Messages');      
    }
    //saveRecord(interaction, '/api/save-record', 'ChatLastMessages');   // TODO     
  }

  const saveNewChat = async function (new_chat: any) {
    let chat_id = null;
    //const new_chat = chats.length ? chats[chats.length - 1] : null;
    if(new_chat != null) {
      chat_id = await saveRecord({...new_chat}, '/api/save-record', 'Chats');      
    }
    return chat_id;
  }

  const updateConversationHistory = async function () {
    // TODO: manipulate conversation.history if needed

  }


  useEffect(() => { 
    if (outputStream.length > 0 && !isStreaming) {
      dispatchConversation({ type: 'commit', value: outputStream, metadata });
      saveNewMessagePair();
      updateFrontEndHelperDivs(false, false);
    } else if(!outputStream.length) {
      updateFrontEndHelperDivs(true, false);
    } else {
      updateFrontEndHelperDivs(true, true);
    }
  }, [isStreaming, outputStream]);

/*
  useEffect(() => { 
    if (questionnaireOutputStream.length > 0 && !isStreamingQuestionnaire) {
      dispatchQuestionnaire({ type: 'commit', value: questionnaireOutputStream, questionnaireMetadata });
      saveNewMessagePair();
      updateFrontEndHelperDivsQuestionnaire(false, false);
    } else if(!questionnaireOutputStream.length) {
      updateFrontEndHelperDivsQuestionnaire(true, false);
    } else {
      updateFrontEndHelperDivsQuestionnaire(true, true);
    }
  }, [isStreamingQuestionnaire, questionnaireOutputStream]);
*/

  useEffect(() => {
    if (scrollableElement.current) {
      scrollableElement.current.scrollTop = scrollableElement.current.scrollHeight;
    }
  }, [conversation.input, outputStream, isSuggestionsVisible]);

  /*
  useEffect(() => {
    if (questionnaireScrollableElement.current) {
      questionnaireScrollableElement.current.scrollTop = questionnaireScrollableElement.current.scrollHeight;
    }
  }, [questionnaire.input, questionnaireOutputStream, isSuggestionsVisibleQuestionanaire]);
  */

  useEffect(() => {
    if (conversation.input.length > 0 && !isStreaming) {
      //updateConversationHistory();
      startStream(conversation.input, conversation);
      setInputValue('');
    }
  }, [conversation.input]);

  /*
  useEffect(() => {
    if (questionnaire.input.length > 0 && !isStreamingQuestionnaire) {
      //updateConversationHistory();
      startStreamQuestionnaire(questionnaire.input, questionnaire);
      //setInputValue('');
    }
  }, [questionnaire.input]);
  */


  

  return (
    <main className={`h-screen ${inter.className}`}>
      <Head>
        <title>{aiName}</title>
      </Head>
      <div className="h-full relative flex flex-row justify-center">


        <aside className="flex flex-col items-start justify-start">
          <a className="main-logo-wrapper" href="/">
            <svg width="32" height="32" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md" role="img"> <text x="-9999" y="-9999">MAXIAI</text> <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="currentColor"></path> </svg>
            <h2 className="">{aiTitle}</h2>
          </a>
          <button className="new-chat-button" onClick={newChat}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M9.99999 4.16667V15.8333M4.16666 10H15.8333" stroke="#364152" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/></svg>
            New Chat
          </button>

          <ChatList children={{chats: chats, changeChat: changeChat, editChatTitle: editChatTitle, deleteChat: deleteChat}} />

          {/*            
          <ul className="list-of-chats">
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20V14" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p><span>Current Chat</span></p>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.1666 10.6111L13.3888 7.83333M5.40272 18.5972L7.75297 18.3361C8.04012 18.3042 8.18369 18.2882 8.31789 18.2448C8.43695 18.2062 8.55025 18.1518 8.65472 18.0829C8.77248 18.0052 8.87462 17.9031 9.07892 17.6988L18.25 8.52777C19.017 7.76071 19.017 6.51705 18.25 5.74999C17.4829 4.98293 16.2392 4.98293 15.4722 5.74999L6.30114 14.921C6.09685 15.1253 5.9947 15.2275 5.91705 15.3452C5.84816 15.4497 5.7937 15.563 5.75516 15.682C5.71171 15.8162 5.69576 15.9598 5.66386 16.247L5.40272 18.5972Z" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.91667 5.75H14.0833M5.75 7.83334H18.25M16.8611 7.83334L16.3741 15.1384C16.301 16.2344 16.2645 16.7824 16.0278 17.1979C15.8194 17.5637 15.505 17.8578 15.1262 18.0414C14.6958 18.25 14.1466 18.25 13.0482 18.25H10.9518C9.85341 18.25 9.30419 18.25 8.87385 18.0414C8.49497 17.8578 8.18062 17.5637 7.97221 17.1979C7.73549 16.7824 7.69896 16.2344 7.62589 15.1384L7.13889 7.83334M10.6111 10.9583V14.4306M13.3889 10.9583V14.4306" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20V14" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p><span>Plan an itinerary to experience</span></p>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.1666 10.6111L13.3888 7.83333M5.40272 18.5972L7.75297 18.3361C8.04012 18.3042 8.18369 18.2882 8.31789 18.2448C8.43695 18.2062 8.55025 18.1518 8.65472 18.0829C8.77248 18.0052 8.87462 17.9031 9.07892 17.6988L18.25 8.52777C19.017 7.76071 19.017 6.51705 18.25 5.74999C17.4829 4.98293 16.2392 4.98293 15.4722 5.74999L6.30114 14.921C6.09685 15.1253 5.9947 15.2275 5.91705 15.3452C5.84816 15.4497 5.7937 15.563 5.75516 15.682C5.71171 15.8162 5.69576 15.9598 5.66386 16.247L5.40272 18.5972Z" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.91667 5.75H14.0833M5.75 7.83334H18.25M16.8611 7.83334L16.3741 15.1384C16.301 16.2344 16.2645 16.7824 16.0278 17.1979C15.8194 17.5637 15.505 17.8578 15.1262 18.0414C14.6958 18.25 14.1466 18.25 13.0482 18.25H10.9518C9.85341 18.25 9.30419 18.25 8.87385 18.0414C8.49497 17.8578 8.18062 17.5637 7.97221 17.1979C7.73549 16.7824 7.69896 16.2344 7.62589 15.1384L7.13889 7.83334M10.6111 10.9583V14.4306M13.3889 10.9583V14.4306" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20V14" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p><span>Plan an itinerary to experience</span></p>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.1666 10.6111L13.3888 7.83333M5.40272 18.5972L7.75297 18.3361C8.04012 18.3042 8.18369 18.2882 8.31789 18.2448C8.43695 18.2062 8.55025 18.1518 8.65472 18.0829C8.77248 18.0052 8.87462 17.9031 9.07892 17.6988L18.25 8.52777C19.017 7.76071 19.017 6.51705 18.25 5.74999C17.4829 4.98293 16.2392 4.98293 15.4722 5.74999L6.30114 14.921C6.09685 15.1253 5.9947 15.2275 5.91705 15.3452C5.84816 15.4497 5.7937 15.563 5.75516 15.682C5.71171 15.8162 5.69576 15.9598 5.66386 16.247L5.40272 18.5972Z" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.91667 5.75H14.0833M5.75 7.83334H18.25M16.8611 7.83334L16.3741 15.1384C16.301 16.2344 16.2645 16.7824 16.0278 17.1979C15.8194 17.5637 15.505 17.8578 15.1262 18.0414C14.6958 18.25 14.1466 18.25 13.0482 18.25H10.9518C9.85341 18.25 9.30419 18.25 8.87385 18.0414C8.49497 17.8578 8.18062 17.5637 7.97221 17.1979C7.73549 16.7824 7.69896 16.2344 7.62589 15.1384L7.13889 7.83334M10.6111 10.9583V14.4306M13.3889 10.9583V14.4306" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20V14" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p><span>Plan an itinerary to experience</span></p>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.1666 10.6111L13.3888 7.83333M5.40272 18.5972L7.75297 18.3361C8.04012 18.3042 8.18369 18.2882 8.31789 18.2448C8.43695 18.2062 8.55025 18.1518 8.65472 18.0829C8.77248 18.0052 8.87462 17.9031 9.07892 17.6988L18.25 8.52777C19.017 7.76071 19.017 6.51705 18.25 5.74999C17.4829 4.98293 16.2392 4.98293 15.4722 5.74999L6.30114 14.921C6.09685 15.1253 5.9947 15.2275 5.91705 15.3452C5.84816 15.4497 5.7937 15.563 5.75516 15.682C5.71171 15.8162 5.69576 15.9598 5.66386 16.247L5.40272 18.5972Z" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.91667 5.75H14.0833M5.75 7.83334H18.25M16.8611 7.83334L16.3741 15.1384C16.301 16.2344 16.2645 16.7824 16.0278 17.1979C15.8194 17.5637 15.505 17.8578 15.1262 18.0414C14.6958 18.25 14.1466 18.25 13.0482 18.25H10.9518C9.85341 18.25 9.30419 18.25 8.87385 18.0414C8.49497 17.8578 8.18062 17.5637 7.97221 17.1979C7.73549 16.7824 7.69896 16.2344 7.62589 15.1384L7.13889 7.83334M10.6111 10.9583V14.4306M13.3889 10.9583V14.4306" stroke="#4B5565" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </li>
          </ul>
          */}
          <div className="settings-wrapper">
            <ul>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.13626 9.13628L4.92893 4.92896M4.92893 19.0711L9.16797 14.8321M14.8611 14.8638L19.0684 19.0711M19.0684 4.92896L14.8287 9.16862M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <p>Support</p>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.7273 14.7273C18.6063 15.0015 18.5702 15.3056 18.6236 15.6005C18.6771 15.8954 18.8177 16.1676 19.0273 16.3818L19.0818 16.4364C19.2509 16.6052 19.385 16.8057 19.4765 17.0265C19.568 17.2472 19.6151 17.4838 19.6151 17.7227C19.6151 17.9617 19.568 18.1983 19.4765 18.419C19.385 18.6397 19.2509 18.8402 19.0818 19.0091C18.913 19.1781 18.7124 19.3122 18.4917 19.4037C18.271 19.4952 18.0344 19.5423 17.7955 19.5423C17.5565 19.5423 17.3199 19.4952 17.0992 19.4037C16.8785 19.3122 16.678 19.1781 16.5091 19.0091L16.4545 18.9545C16.2403 18.745 15.9682 18.6044 15.6733 18.5509C15.3784 18.4974 15.0742 18.5335 14.8 18.6545C14.5311 18.7698 14.3018 18.9611 14.1403 19.205C13.9788 19.4489 13.8921 19.7347 13.8909 20.0273V20.1818C13.8909 20.664 13.6994 21.1265 13.3584 21.4675C13.0174 21.8084 12.5549 22 12.0727 22C11.5905 22 11.1281 21.8084 10.7871 21.4675C10.4461 21.1265 10.2545 20.664 10.2545 20.1818V20.1C10.2475 19.7991 10.1501 19.5073 9.97501 19.2625C9.79991 19.0176 9.55521 18.8312 9.27273 18.7273C8.99853 18.6063 8.69437 18.5702 8.39947 18.6236C8.10456 18.6771 7.83244 18.8177 7.61818 19.0273L7.56364 19.0818C7.39478 19.2509 7.19425 19.385 6.97353 19.4765C6.7528 19.568 6.51621 19.6151 6.27727 19.6151C6.03834 19.6151 5.80174 19.568 5.58102 19.4765C5.36029 19.385 5.15977 19.2509 4.99091 19.0818C4.82186 18.913 4.68775 18.7124 4.59626 18.4917C4.50476 18.271 4.45766 18.0344 4.45766 17.7955C4.45766 17.5565 4.50476 17.3199 4.59626 17.0992C4.68775 16.8785 4.82186 16.678 4.99091 16.5091L5.04545 16.4545C5.25503 16.2403 5.39562 15.9682 5.4491 15.6733C5.50257 15.3784 5.46647 15.0742 5.34545 14.8C5.23022 14.5311 5.03887 14.3018 4.79497 14.1403C4.55107 13.9788 4.26526 13.8921 3.97273 13.8909H3.81818C3.33597 13.8909 2.87351 13.6994 2.53253 13.3584C2.19156 13.0174 2 12.5549 2 12.0727C2 11.5905 2.19156 11.1281 2.53253 10.7871C2.87351 10.4461 3.33597 10.2545 3.81818 10.2545H3.9C4.2009 10.2475 4.49273 10.1501 4.73754 9.97501C4.98236 9.79991 5.16883 9.55521 5.27273 9.27273C5.39374 8.99853 5.42984 8.69437 5.37637 8.39947C5.3229 8.10456 5.18231 7.83244 4.97273 7.61818L4.91818 7.56364C4.74913 7.39478 4.61503 7.19425 4.52353 6.97353C4.43203 6.7528 4.38493 6.51621 4.38493 6.27727C4.38493 6.03834 4.43203 5.80174 4.52353 5.58102C4.61503 5.36029 4.74913 5.15977 4.91818 4.99091C5.08704 4.82186 5.28757 4.68775 5.50829 4.59626C5.72901 4.50476 5.96561 4.45766 6.20455 4.45766C6.44348 4.45766 6.68008 4.50476 6.9008 4.59626C7.12152 4.68775 7.32205 4.82186 7.49091 4.99091L7.54545 5.04545C7.75971 5.25503 8.03183 5.39562 8.32674 5.4491C8.62164 5.50257 8.9258 5.46647 9.2 5.34545H9.27273C9.54161 5.23022 9.77093 5.03887 9.93245 4.79497C10.094 4.55107 10.1807 4.26526 10.1818 3.97273V3.81818C10.1818 3.33597 10.3734 2.87351 10.7144 2.53253C11.0553 2.19156 11.5178 2 12 2C12.4822 2 12.9447 2.19156 13.2856 2.53253C13.6266 2.87351 13.8182 3.33597 13.8182 3.81818V3.9C13.8193 4.19253 13.906 4.47834 14.0676 4.72224C14.2291 4.96614 14.4584 5.15749 14.7273 5.27273C15.0015 5.39374 15.3056 5.42984 15.6005 5.37637C15.8954 5.3229 16.1676 5.18231 16.3818 4.97273L16.4364 4.91818C16.6052 4.74913 16.8057 4.61503 17.0265 4.52353C17.2472 4.43203 17.4838 4.38493 17.7227 4.38493C17.9617 4.38493 18.1983 4.43203 18.419 4.52353C18.6397 4.61503 18.8402 4.74913 19.0091 4.91818C19.1781 5.08704 19.3122 5.28757 19.4037 5.50829C19.4952 5.72901 19.5423 5.96561 19.5423 6.20455C19.5423 6.44348 19.4952 6.68008 19.4037 6.9008C19.3122 7.12152 19.1781 7.32205 19.0091 7.49091L18.9545 7.54545C18.745 7.75971 18.6044 8.03183 18.5509 8.32674C18.4974 8.62164 18.5335 8.9258 18.6545 9.2V9.27273C18.7698 9.54161 18.9611 9.77093 19.205 9.93245C19.4489 10.094 19.7347 10.1807 20.0273 10.1818H20.1818C20.664 10.1818 21.1265 10.3734 21.4675 10.7144C21.8084 11.0553 22 11.5178 22 12C22 12.4822 21.8084 12.9447 21.4675 13.2856C21.1265 13.6266 20.664 13.8182 20.1818 13.8182H20.1C19.8075 13.8193 19.5217 13.906 19.2778 14.0676C19.0339 14.2291 18.8425 14.4584 18.7273 14.7273Z" stroke="#697586" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <p>Settings</p>
              </li>
            </ul>
            <button onClick={execCommand}>Execute Shell Command</button>
            <button onClick={fetchData}>Fetch Data</button>
            
          </div>
          <div className="profile-wrapper">
            <img src="https://via.placeholder.com/40"></img>
            <div>
              <p>Nic Fassbender</p>
              <p className="light">nicfassbender@gmail.com</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M21.3333 22.1666L25.5 18M25.5 18L21.3333 13.8333M25.5 18H15.5M18 22.1666C18 22.413 18 22.5361 17.9908 22.6428C17.8957 23.7516 17.079 24.664 15.9875 24.881C15.8825 24.9019 15.76 24.9155 15.5153 24.9427L14.6641 25.0373C13.3854 25.1794 12.746 25.2504 12.2381 25.0879C11.5608 24.8711 11.0078 24.3762 10.7176 23.727C10.5 23.2401 10.5 22.5968 10.5 21.3102V14.6897C10.5 13.4031 10.5 12.7598 10.7176 12.2729C11.0078 11.6237 11.5608 11.1288 12.2381 10.9121C12.746 10.7495 13.3854 10.8206 14.6641 10.9627L15.5153 11.0572C15.7601 11.0844 15.8825 11.098 15.9875 11.1189C17.079 11.3359 17.8957 12.2483 17.9908 13.3571C18 13.4638 18 13.587 18 13.8333" stroke="#697586" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </aside>


        <div className="main-wrapper" ref={mainWrapper}>


          <div className="questionnaire-window">
            <div className={`scrollbar scrollbar-vertical flex-grow overflow-y-auto flex flex-col gap-0 pb-2`} ref={questionnaireScrollableElement}>
              {questionnaire?.history.map((interaction, index, questionnaire) => (
                <div key={index}>
                  <div className="user-message">
                    <Output text={interaction.output} />
                  </div>
                  <div className="maxi-message">
                    <div className="maxi-message-wrapper">
                      <Input>{interaction.input}</Input>
                    </div>
                  </div>
                  {index === questionnaire.length - 1 ? <Sources metadata={interaction.metadata} /> : null}
                </div>
              ))}
              <div className="user-message" style={{display: showHelperDivUser ? 'block' : 'none' }}>
                {questionnaire.input ? <Input>{questionnaire.input}</Input> : null}
              </div>
              <div className="maxi-message" style={{display: showHelperDivMaxiQuestionnaire ? 'block' : 'none' }}>
                <div className="maxi-message-wrapper">
                  <Output text={questionnaireOutputStream} />
                </div>
              </div>
            </div>
          </div>


          <div className="chat-window active">
            <div className={`scrollbar scrollbar-vertical flex-grow overflow-y-auto flex flex-col gap-0 pb-2`} ref={scrollableElement}>
              <h1 className="main-heading" ref={mainHeading}>Maxi AI</h1>
              {conversation?.history.map((interaction, index, conversation) => (
                <div key={index}>
                  <div className="user-message">
                    <Input>{interaction.input}</Input>
                  </div>
                  <div className="maxi-message">
                    <div className="maxi-message-wrapper">
                      <Output text={interaction.output} />
                    </div>
                  </div>
                  {index === conversation.length - 1 ? <Sources metadata={interaction.metadata} /> : null}
                </div>
              ))}
              <div className="user-message" style={{display: showHelperDivUser ? 'block' : 'none' }}>
                {conversation.input ? <Input>{conversation.input}</Input> : null}
              </div>
              <div className="maxi-message" style={{display: showHelperDivMaxi ? 'block' : 'none' }}>
                <div className="maxi-message-wrapper">
                  <Output text={outputStream} />
                </div>
              </div>
            </div>
            <div>


              <div className="questionarie">
                <div className="questions">
                  <div className="question">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="24" fill="#CCFBEF"/><path d="M28 20V25C28 25.7956 28.3161 26.5587 28.8787 27.1213C29.4413 27.6839 30.2044 28 31 28C31.7957 28 32.5587 27.6839 33.1213 27.1213C33.6839 26.5587 34 25.7956 34 25V24C33.9999 21.743 33.2362 19.5525 31.8333 17.7845C30.4303 16.0166 28.4706 14.7752 26.2726 14.2623C24.0747 13.7494 21.7679 13.995 19.7273 14.9594C17.6868 15.9237 16.0324 17.5499 15.0333 19.5737C14.0341 21.5975 13.749 23.8997 14.2242 26.1061C14.6994 28.3125 15.907 30.2932 17.6506 31.7263C19.3943 33.1593 21.5714 33.9603 23.8281 33.9991C26.0847 34.0379 28.2881 33.3122 30.08 31.94M28 24C28 26.2091 26.2091 28 24 28C21.7909 28 20 26.2091 20 24C20 21.7909 21.7909 20 24 20C26.2091 20 28 21.7909 28 24Z" stroke="#0E9384" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div>
                      <h4>Answer Marketing Questionnaire</h4>
                      <p>Help Maxi understand your marketing </p>
                    </div>
                  </div>
                  <div className="question">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="24" fill="#CCFBEF"/><path d="M33 30L31.9999 31.094C31.4695 31.6741 30.7501 32 30.0001 32C29.2501 32 28.5308 31.6741 28.0004 31.094C27.4692 30.5151 26.75 30.1901 26.0002 30.1901C25.2504 30.1901 24.5311 30.5151 24 31.094M15 32H16.6745C17.1637 32 17.4083 32 17.6385 31.9447C17.8426 31.8957 18.0377 31.8149 18.2166 31.7053C18.4184 31.5816 18.5914 31.4086 18.9373 31.0627L31.5 18.5C32.3285 17.6716 32.3285 16.3284 31.5 15.5C30.6716 14.6716 29.3285 14.6716 28.5 15.5L15.9373 28.0627C15.5914 28.4086 15.4184 28.5816 15.2947 28.7834C15.1851 28.9624 15.1043 29.1574 15.0553 29.3615C15 29.5917 15 29.8363 15 30.3255V32Z" stroke="#0E9384" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div>
                      <h4>Answer Sales Questionnaire</h4>
                      <p>Help Maxi understand sales </p>
                    </div>
                  </div>
                  <div className="question">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="24" fill="#CCFBEF"/><path d="M33.2104 27.89C32.5742 29.3945 31.5792 30.7202 30.3123 31.7513C29.0454 32.7824 27.5452 33.4874 25.9428 33.8048C24.3405 34.1221 22.6848 34.0422 21.1205 33.5718C19.5563 33.1015 18.131 32.2551 16.9694 31.1067C15.8078 29.9582 14.9452 28.5428 14.457 26.984C13.9689 25.4252 13.87 23.7705 14.169 22.1646C14.468 20.5588 15.1559 19.0506 16.1724 17.772C17.189 16.4934 18.5033 15.4833 20.0004 14.83M33.2392 20.1732C33.6395 21.1396 33.8851 22.1614 33.9684 23.2009C33.989 23.4577 33.9993 23.5861 33.9483 23.7017C33.9057 23.7983 33.8213 23.8898 33.7284 23.9399C33.6172 24 33.4783 24 33.2004 24H24.8004C24.5204 24 24.3804 24 24.2734 23.9455C24.1793 23.8976 24.1028 23.8211 24.0549 23.727C24.0004 23.62 24.0004 23.48 24.0004 23.2V14.8C24.0004 14.5221 24.0004 14.3832 24.0605 14.272C24.1107 14.1791 24.2021 14.0947 24.2987 14.0521C24.4144 14.0011 24.5428 14.0114 24.7996 14.032C25.839 14.1153 26.8608 14.3609 27.8272 14.7612C29.0405 15.2638 30.1429 16.0004 31.0715 16.9289C32.0001 17.8575 32.7367 18.9599 33.2392 20.1732Z" stroke="#0E9384" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div>
                      <h4>Answer Brand Questionnaire</h4>
                      <p>Help Maxi understand your brand </p>
                    </div>
                  </div>
                  <div className="question">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="24" fill="#CCFBEF"/><path d="M24.913 29H32.087M24.913 29L23 33M24.913 29L27.7783 23.009C28.0092 22.5263 28.1246 22.2849 28.2826 22.2086C28.4199 22.1423 28.5801 22.1423 28.7174 22.2086C28.8754 22.2849 28.9908 22.5263 29.2217 23.009L32.087 29M32.087 29L34 33M14 17H20M20 17H23.5M20 17V15M23.5 17H26M23.5 17C23.0039 19.9573 21.8526 22.6362 20.1655 24.8844M22 26C21.3875 25.7248 20.7626 25.3421 20.1655 24.8844M20.1655 24.8844C18.813 23.8478 17.6028 22.4266 17 21M20.1655 24.8844C18.5609 27.0229 16.4714 28.7718 14 30" stroke="#0E9384" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div>
                      <h4>Translate this...</h4>
                      <p>Additional info... </p>
                    </div>
                  </div>
                </div>
                <button  onClick={onQuestionarieOpen}>
                    <span ref={questionarieButtonSpan}>Show Questionnaires</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="#4B5565" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
              </div>


              <form className="relative chat-form" onSubmit={onSubmit}>
                {/*  
                {isSuggestionsVisible ? (
                  <ul
                    className="list-disc list-inside mb-2"
                    onClick={event => {
                      dispatchConversation({ type: 'setInput', value: (event.target as HTMLElement).innerText });
                      toggleSuggestions();
                    }}>
                    {suggestions.map(suggestion => (
                      <li key={suggestion}>
                        <button className="italic text-sm py-1 hover:underline">{suggestion}</button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                */} 
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-3 w-[20px] h-[20px]" width="21" height="20" viewBox="0 0 21 20" fill="none"><g id="attatchment-01"><path id="XMLID_6_" d="M17.4152 10.201L10.8101 16.8061C9.01233 18.6038 6.31613 18.8161 4.48318 16.9832C2.68541 15.1854 2.91906 12.5809 4.75201 10.748L12.1768 3.32315C13.3132 2.18679 15.1426 2.18679 16.279 3.32315C17.4154 4.45951 17.4154 6.28895 16.279 7.42531L8.72379 14.9805C8.1574 15.5469 7.2391 15.5469 6.67272 14.9805C6.10633 14.4141 6.10633 13.4958 6.67272 12.9294L13.4082 6.19396" stroke="#919191" strokeWidth="1.5" strokeLinecap="round"></path></g></svg>
                <input
                  type="text"
                  name="query"
                  placeholder="Send a message"
                  value={inputValue}
                  onChange={onChange}
                  className="flex flex-col flex-grow chat-input"
                />

                {/*  
                <div className="flex flex-row gap-4 absolute top-3 right-4">
                  <button
                    type="button"
                    className="bg-transparent appearance-none text-xs italic text-left cursor-pointer p-0 hover:underline flex-grow d-none"
                    onClick={toggleSuggestions}>
                    Need suggestions?
                  </button>

                  {/ *  <InputButton type="reset" value="Reset" onClick={() => dispatchConversation({ type: 'reset' })} /> * /} 
                  <InputButton type="submit" value="Send" />
                </div>
                */} 

                <p>This is a hint text to help user or display some <a href="#">disclaimer</a>.</p>
              </form>
            </div>              
          </div>
        </div>

      </div>
    </main>
  );
}
