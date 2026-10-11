# Video research notes

Checked 11 October 2026. These notes inform the extended video, not a claim of additional shipped infrastructure.

## Main findings

- Keep a separate competition cut at three minutes or less. The longer backend and investment walkthrough is supplementary.
- Explain Nebius as the live inference provider, NVIDIA Nemotron as the model family, and SpareCycle's server as the authority that validates results and controls execution.
- Use the completed synthetic run as evidence. A usage screenshot alone does not establish correctness, efficiency, or customer impact.
- Fund evaluation, reliability and customer onboarding before expanding into broad autonomous repository or hardware work.
- Dedicated capacity is a future option to evaluate against measured requirements; it is not part of the current deployment.

## Research questions

1. What does the current competition require for the video and Best Apps and Agents track?
2. How do Nebius inference, structured output and execution services differ?
3. What can provider usage and observability establish?
4. When would dedicated inference be justified?

Searches included `Nebius Token Factory structured outputs function calling documentation`, `Nebius Serverless Jobs documentation overview`, and NVIDIA's official Nemotron agentic-coding documentation. The competition pages and current provider documentation were read directly. Context7 returned a general Nebius infrastructure library, rather than a relevant Token Factory inference reference; the provider's documentation was used instead.

## Competition framing

The official competition page requires a public YouTube demonstration of three minutes or less. It asks entrants to demonstrate how Nebius and NVIDIA models are used. The Best Apps and Agents track emphasizes a useful application, and judging considers technical implementation, design, impact and idea quality. The extended video must therefore be labeled supplementary, with the shorter cut retained. Hosting an MP4 on the project website does not itself satisfy the YouTube submission requirement. [Official requirements](https://nebiusglobalaihackathon.devpost.com/), [official rules](https://nebiusglobalaihackathon.devpost.com/rules).

## Provider and model roles

Nebius offers NVIDIA Nemotron through an OpenAI-compatible inference interface, with different model roles and endpoint availability. The product should describe its actual configured routes and tested calls rather than borrow model benchmark scores as product performance. [Nebius Nemotron overview](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference), [NVIDIA agentic coding cookbook](https://docs.nvidia.com/nemotron/latest/usage-cookbook/Nemotron-3-Super/OpenScaffoldingResources/README.html).

Nebius documents both schema-based JSON and arbitrary JSON output modes. Support and quality depend on the selected model. Application-side validation remains necessary: a valid JSON object cannot prove that a proposed patch is correct. That final sentence is our engineering inference, supported by the separate validation and verification stages implemented in SpareCycle. [Structured outputs documentation](https://docs.tokenfactory.nebius.com/ai-models-inference/json).

## Usage and operational evidence

The supplied usage screenshot supports that four model tiers were used in the account. It does not identify which model produced each patch, demonstrate cost per accepted fix, or measure production reliability. Those claims require per-stage records and a representative workload.

Nebius's current observability guide lists operational metrics and states that those metrics are accessible for dedicated endpoints. It also distinguishes operational dashboards from billing reconciliation. We should therefore propose application-level latency, failures and accepted-fix measurements, rather than invent a current production benchmark from account usage. [Inference observability](https://docs.tokenfactory.nebius.com/ai-models-inference/observability).

## Investment-dependent infrastructure

Nebius's dedicated endpoint guide distinguishes shared public capacity and token billing from reserved deployments, selected regions, controlled scaling and GPU-time billing. Public inference should not be described as having a customer-fixed processing region. Dedicated capacity would be a candidate for evaluation after obtaining real workload and residency requirements; no purchase or deployment is part of this video task. [Dedicated endpoint overview](https://docs.tokenfactory.nebius.com/ai-models-inference/dedicated-endpoints/overview).

The documentation index separately lists inference and Sandboxes. SpareCycle currently performs real inference through Token Factory, while the verified test execution uses GitHub Actions. A Sandbox adapter or a future Nebius background worker is not evidence that today's tests ran there. [Official documentation index](https://docs.tokenfactory.nebius.com/llms.txt), [local implementation evidence](BACKEND-EVIDENCE.md).

## Not verified

No customer demand, willingness to pay, market share, fleet-wide accuracy, carbon savings, hardware repair success or production SLA has been demonstrated by this research. No model size, context-window size, price or vendor benchmark is used as a product result. The proposed customer segment, funding priorities and acceptance gates are hypotheses in the [investment roadmap](INVESTMENT-ROADMAP.md).
