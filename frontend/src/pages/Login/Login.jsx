import Form from "../../components/Form/Form"

function Login() {
    localStorage.clear();
    return <Form route="/api/token/" method="login" />
}

export default Login