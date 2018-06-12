const CSRF_NAME: string = "fkey";
const CSRF_HEADER: string = `X-KA-${CSRF_NAME}`;
const COOKIE: string = "cookie";
const EXTENSION_ID: string = "goejbbmaedgamncedjggaanjkdmaajmh"; //"oidabgkhdbhpidagfnmfgdgehbblalnc";//gniggljddhajnfbkjndcgnomkddfcial";
const EXTENSION_COMMENT_CLASSNAME: string = "ka-extension-modified-comment";
const EXTENSION_ITEM_CLASSNAME: string = "ka-extension-modified-item";
const QUEUE_ROOT: string = "https://reportqueue.herokuapp.com/";
const LS_PREFIX: string = "ka-extension-";

export {
    CSRF_NAME, CSRF_HEADER, COOKIE,
    EXTENSION_ID, QUEUE_ROOT, EXTENSION_COMMENT_CLASSNAME,
    LS_PREFIX, EXTENSION_ITEM_CLASSNAME
};
