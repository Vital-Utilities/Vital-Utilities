import { applyMiddleware, createStore } from "redux";

import { RootReducer } from "../reducers/rootReducer";
import { InitialState } from "../States";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";

const enhancedDevTools = composeWithDevTools({ trace: true });
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function configureStore() {
    const store = createStore(
        RootReducer,
        InitialState,
        enhancedDevTools(
            applyMiddleware(thunk)
            // other store enhancers if any
        )
    );

    return store;
}
