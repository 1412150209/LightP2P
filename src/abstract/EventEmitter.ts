export class EventEmitter<E extends Record<string, any>> {
    private eventListeners: Record<keyof E, Array<(arg: any) => void>> =
        Object.create(null)

    addListener<N extends keyof E>(
        eventName: N,
        listener: (arg: E[typeof eventName]) => void
    ): this {
        return this.on(eventName, listener)
    }

    removeListener<N extends keyof E>(
        eventName: N,
        listener: (arg: E[typeof eventName]) => void
    ): this {
        return this.off(eventName, listener)
    }

    on<N extends keyof E>(
        eventName: N,
        listener: (arg: E[typeof eventName]) => void
    ): this {
        if (eventName in this.eventListeners) {
            this.eventListeners[eventName].push(listener)
        } else {
            this.eventListeners[eventName] = [listener]
        }
        return this
    }

    off<N extends keyof E>(
        eventName: N,
        listener: (arg: E[typeof eventName]) => void
    ): this {
        if (eventName in this.eventListeners) {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(
                (l) => l !== listener
            )
        }
        return this
    }

    emit<N extends keyof E>(eventName: N, arg: E[typeof eventName]): boolean {
        if (eventName in this.eventListeners) {
            const listeners = this.eventListeners[eventName]
            for (const listener of listeners) listener(arg)
            return true
        }
        return false
    }
}