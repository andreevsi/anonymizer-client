import axios from 'axios';

export class HttpClient {
    public async get(url: string): Promise<any> {
        const result = await axios.get(url);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (result.status !== 200) {
            throw new Error(`Post request error: ${JSON.stringify(result)}`);
        }
        return result.data;
    }

    public async post(url: string, body: any): Promise<void> {
        const result = await axios.post(url, body);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (result.status !== 200) {
            throw new Error(`Post request error: ${JSON.stringify(result)}`);
        }
    }
}
