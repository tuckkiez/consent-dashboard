import { useState } from 'react'
import {
  ChakraProvider,
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useToast
} from '@chakra-ui/react'
import axios from 'axios'
import { format } from 'date-fns'

interface ConsentData {
  total_count: number
  profiles: any[]
  date: string
}

function App() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ConsentData | null>(null)
  const toast = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:8000/api/consent-data/${date}`)
      setData(response.data)
    } catch (error) {
      toast({
        title: 'Error fetching data',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChakraProvider>
      <Box p={8}>
        <VStack spacing={8} align="stretch">
          <Heading>Consent Dashboard</Heading>
          
          <Box>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            <Button
              ml={4}
              colorScheme="blue"
              onClick={fetchData}
              isLoading={loading}
            >
              Fetch Data
            </Button>
          </Box>

          {loading ? (
            <Box textAlign="center">
              <Spinner size="xl" />
            </Box>
          ) : data ? (
            <Box>
              <Text fontSize="xl" mb={4}>
                Total Consents for {data.date}: {data.total_count}
              </Text>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Identifier</Th>
                    <Th>Created</Th>
                    <Th>Updated</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.profiles.map((profile, index) => (
                    <Tr key={index}>
                      <Td>{profile.id}</Td>
                      <Td>{profile.identifier}</Td>
                      <Td>{new Date(profile.createTime).toLocaleString()}</Td>
                      <Td>{new Date(profile.lastInteractionDate).toLocaleString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : null}
        </VStack>
      </Box>
    </ChakraProvider>
  )
}

export default App
