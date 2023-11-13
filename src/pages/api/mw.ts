import axios from 'axios';

export default async function (req, res) {
    fetch("http://localhost", {
        method: "POST",
        body: JSON.stringify({
            line: 'test-content',
        }),
        headers: {
            "content-type": "application/json",
        },
    }).catch((e) => console.log(e));
}
