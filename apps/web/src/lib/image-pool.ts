// ── 外链图片并发加载控制 ──

type Resolver = () => void;

/** 信号量：限制同时加载的外链图片数量 */
class ImageLoadPool {
	private _limit: number;
	private _active = 0;
	private _queue: Resolver[] = [];

	constructor(limit: number) {
		this._limit = limit;
	}

	get limit() {
		return this._limit;
	}

	/** 动态调整并发上限 */
	setLimit(n: number) {
		this._limit = Math.max(1, n);
		this._flush();
	}

	/** 获取一个加载槽位，返回释放函数 */
	acquire(): Promise<() => void> {
		if (this._active < this._limit) {
			this._active++;
			return Promise.resolve(() => this._release());
		}
		return new Promise<() => void>((resolve) => {
			this._queue.push(() => {
				this._active++;
				resolve(() => this._release());
			});
		});
	}

	private _release() {
		this._active--;
		this._flush();
	}

	private _flush() {
		while (this._active < this._limit && this._queue.length > 0) {
			const next = this._queue.shift()!;
			next();
		}
	}
}

/** 全局单例 */
export const imagePool = new ImageLoadPool(20);
